import React, { useState, useEffect } from "react";
import { useMetaMask } from "../hooks/useMetaMask";
import { useGovernanceToken } from "../hooks/useGovernanceToken";
import { getContract } from "../utils/contract";
import toast from "react-hot-toast";
import {
  Vote,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  PlusCircle,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Play,
} from "lucide-react";

const PROPOSAL_TYPES = {
  0: "Autorizar Emissor",
  1: "Revogar Emissor",
  2: "Revogar Certificado",
};

const GovernancePage = () => {
  const { signer, account, isConnected } = useMetaMask();
  const { balance, hasToken, isLoading: tokenLoading, formatBalance } = useGovernanceToken();

  const [activeProposals, setActiveProposals] = useState([]);
  const [pendingExecution, setPendingExecution] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [form, setForm] = useState({
    proposalType: "2",
    targetAddress: "0x0000000000000000000000000000000000000000",
    targetCertId: "0",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isConnected && signer) {
      loadProposals();
    }
  }, [isConnected, signer]);

  const loadProposals = async () => {
    setProposalsLoading(true);
    try {
      const contract = getContract(signer);
      const activeIds = await contract.getActiveProposals();

      const stored = JSON.parse(localStorage.getItem("governance_seen_ids") || "[]");
      const allIds = [...new Set([...stored.map(String), ...activeIds.map(String)])];
      localStorage.setItem("governance_seen_ids", JSON.stringify(allIds));

      const details = await Promise.all(allIds.map((id) => contract.getProposal(id)));
      const agora = Math.floor(Date.now() / 1000);

      setActiveProposals(details.filter((p) => !isExpired(p.deadline) && !p.executed));
      setPendingExecution(details.filter((p) => !p.executed && Number(p.deadline) < agora));
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleVote = async (proposalId, support) => {
    try {
      const contract = getContract(signer);
      const jaVotou = await contract.hasVoted(proposalId, account);
      if (jaVotou) {
        toast.error("Você já votou nesta proposta");
        return;
      }
      const tx = await contract.vote(proposalId, support);
      toast.loading("Registrando voto...", { id: "vote" });
      await tx.wait();
      toast.success("Voto registrado!", { id: "vote" });
      loadProposals();
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleExecute = async (proposalId) => {
    try {
      const contract = getContract(signer);
      const tx = await contract.executeProposal(proposalId);
      toast.loading("Executando proposta...", { id: "exec" });
      await tx.wait();
      toast.success("Proposta executada!", { id: "exec" });
      loadProposals();
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!hasToken) {
      toast.error("Você precisa de tokens ACT");
      return;
    }
    setIsSubmitting(true);
    try {
      const contract = getContract(signer);
      const tx = await contract.createProposal(
        parseInt(form.proposalType),
        form.targetAddress,
        BigInt(form.targetCertId),
        form.description
      );
      toast.loading("Criando proposta...", { id: "prop" });
      await tx.wait();
      toast.success("Proposta criada!", { id: "prop" });
      setForm({
        proposalType: "2",
        targetAddress: "0x0000000000000000000000000000000000000000",
        targetCertId: "0",
        description: "",
      });
      loadProposals();
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormTypeChange = (e) => {
    const type = e.target.value;
    setForm((prev) => ({
      ...prev,
      proposalType: type,
      targetAddress:
        type === "2"
          ? "0x0000000000000000000000000000000000000000"
          : prev.targetAddress === "0x0000000000000000000000000000000000000000"
          ? ""
          : prev.targetAddress,
      targetCertId: type === "0" || type === "1" ? "0" : prev.targetCertId,
    }));
  };

  const formatDeadline = (deadline) => {
    const date = new Date(Number(deadline) * 1000);
    return date.toLocaleString("pt-BR");
  };

  const isExpired = (deadline) =>
    Number(deadline) < Math.floor(Date.now() / 1000);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Conecte sua MetaMask
        </h2>
        <p className="text-gray-500">
          Para acessar a governança, você precisa estar conectado
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Vote className="text-primary-600" size={28} />
            Governança DAO
          </h1>
          <p className="text-gray-500 mt-1">
            Participe das votações e gerencie as propostas da rede AcademicChain
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 min-w-[180px]">
          {tokenLoading ? (
            <Loader2 className="animate-spin text-primary-600" size={20} />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <CheckCircle className="text-primary-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Seu saldo</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatBalance()} ACT
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {!tokenLoading && !hasToken && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-yellow-800">
              Tokens ACT necessários para participar
            </p>
            <p className="text-sm text-yellow-700 mt-0.5">
              Você não possui tokens ACT. Para votar ou criar propostas, entre
              em contato com o administrador da rede para receber tokens de
              governança.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-primary-600" />
          Propostas Ativas
        </h2>

        {proposalsLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-primary-600" size={32} />
            <span className="ml-3 text-gray-600">Carregando propostas...</span>
          </div>
        ) : activeProposals.length === 0 ? (
          <div className="text-center py-10">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma proposta ativa no momento.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {activeProposals.map((p, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        {PROPOSAL_TYPES[Number(p.proposalType)] ?? `Tipo ${p.proposalType}`}
                      </span>
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Em votação
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium break-words">{p.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Prazo: {formatDeadline(p.deadline)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <ThumbsUp size={15} />
                        {Number(p.votesFor)}
                      </span>
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <ThumbsDown size={15} />
                        {Number(p.votesAgainst)}
                      </span>
                    </div>
                    {hasToken && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(p.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors"
                        >
                          <ThumbsUp size={14} />
                          A Favor
                        </button>
                        <button
                          onClick={() => handleVote(p.id, false)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors"
                        >
                          <ThumbsDown size={14} />
                          Contra
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingExecution.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Play size={20} className="text-orange-500" />
            Aguardando Execução
          </h2>
          <div className="space-y-4">
            {pendingExecution.map((p, i) => (
              <div
                key={i}
                className="border border-orange-200 bg-orange-50 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        {PROPOSAL_TYPES[Number(p.proposalType)] ?? `Tipo ${p.proposalType}`}
                      </span>
                      <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Prazo encerrado
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium break-words">{p.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-400">Prazo: {formatDeadline(p.deadline)}</p>
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <ThumbsUp size={12} />
                        {Number(p.votesFor)}
                      </span>
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <ThumbsDown size={12} />
                        {Number(p.votesAgainst)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExecute(p.id)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Play size={14} />
                    Executar Proposta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PlusCircle size={20} className="text-primary-600" />
          Criar Nova Proposta
        </h2>

        {!hasToken && !tokenLoading && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 mb-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
            <p className="text-sm text-yellow-700">
              Você precisa de tokens ACT para criar propostas.
            </p>
          </div>
        )}

        <form onSubmit={handleCreateProposal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Proposta
            </label>
            <select
              value={form.proposalType}
              onChange={handleFormTypeChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            >
              <option value="0">Autorizar Emissor</option>
              <option value="1">Revogar Emissor</option>
              <option value="2">Revogar Certificado</option>
            </select>
          </div>

          {(form.proposalType === "0" || form.proposalType === "1") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço do Emissor
              </label>
              <input
                type="text"
                value={form.targetAddress}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, targetAddress: e.target.value }))
                }
                placeholder="0x..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          {form.proposalType === "2" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID do Certificado
              </label>
              <input
                type="number"
                min="0"
                value={form.targetCertId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, targetCertId: e.target.value }))
                }
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descreva o motivo desta proposta..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !hasToken}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <PlusCircle size={18} />
            )}
            Criar Proposta
          </button>
        </form>
      </div>
    </div>
  );
};

export default GovernancePage;
