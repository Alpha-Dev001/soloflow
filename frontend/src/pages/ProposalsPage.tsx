import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Users,
  Send,
  BadgeCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import type { Proposal, Client } from '../types';

interface ProposalsPageProps {
  proposals: Proposal[];
  clients: Client[];
  isLoading?: boolean;
  onNewProposal: () => void;
  onOpenProposal: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteProposal: (id: string) => Promise<void>;
  onNavigateToClients: () => void;
}

export const ProposalsPage: React.FC<ProposalsPageProps> = ({
  proposals,
  clients,
  isLoading = false,
  onNewProposal,
  onOpenProposal,
  onUpdateStatus,
  onDeleteProposal,
  onNavigateToClients
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Proposal | null>(null);
  const [showNoClientPrompt, setShowNoClientPrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleNewProposalClick = () => {
    if (clients.length === 0) {
      setShowNoClientPrompt(true);
    } else {
      onNewProposal();
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch =
      p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Proposals</h1>
          <p className="text-xs text-[#8C8278] mt-0.5">
            Generate AI-powered proposals, pitch projects, and win contracts.
          </p>
        </div>
        <Button
          onClick={handleNewProposalClick}
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          New Proposal
        </Button>
      </div>

      {/* Empty state — no clients yet */}
      {clients.length === 0 ? (
        <Card className="p-10 sm:p-14">
          <div className="max-w-lg mx-auto text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#F8F7F5', border: '1px solid #E0D9CF' }}
            >
              <FileText className="w-6 h-6" style={{ color: '#82694E' }} />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2" style={{ color: '#1A1918' }}>
              Add a client before writing proposals
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: '#6B6158' }}>
              Every proposal is addressed to a client. Add your first client and you'll be able to generate AI-powered proposals, pitch projects, and track acceptance — all in one workflow.
            </p>
            <div className="flex justify-center mb-8">
              <Button
                onClick={onNavigateToClients}
                variant="primary"
                size="md"
                icon={<Users className="w-4 h-4" />}
              >
                Go to Clients
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {[
                { icon: <Sparkles className="w-4 h-4" />, label: 'AI-generated', body: 'Describe the project and get a professional proposal in seconds.' },
                { icon: <Send className="w-4 h-4" />, label: 'Track acceptance', body: 'See when a client views and accepts your proposal.' },
                { icon: <BadgeCheck className="w-4 h-4" />, label: 'Convert to invoice', body: 'Turn accepted proposals into invoices with one click.' }
              ].map(item => (
                <div
                  key={item.label}
                  className="p-3.5 rounded-xl border text-left"
                  style={{ backgroundColor: '#F8F7F5', borderColor: '#E0D9CF' }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDE8E1', color: '#82694E' }}
                  >
                    {item.icon}
                  </span>
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#1A1918' }}>{item.label}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#8C8278' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#8C8278] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search proposals..."
                className="w-full bg-white text-xs text-[#1A1918] placeholder-[#8C8278] pl-8.5 pr-3 py-1.5 rounded-lg border border-[#EDE8E1] focus:outline-none focus:border-[#82694E] focus:ring-2 focus:ring-[#82694E]/15 transition-all"
              />
            </div>
            <div className="segmented-control self-start sm:self-auto overflow-x-auto max-w-full">
              {['All', 'Sent', 'Viewed', 'Accepted', 'Draft', 'Expired'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer whitespace-nowrap ${statusFilter === st ? 'bg-white text-[#4A3F35] font-medium shadow-2xs' : 'text-[#7A6548] hover:text-[#5C4D35]'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <Card padding="none" className="border border-[#EDE8E1]">
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F0EA] border-b border-[#EDE8E1] text-[11px] font-medium text-[#8C8278] select-none">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Proposal #</th>
                      <th className="py-2.5 px-3 font-medium">Client</th>
                      <th className="py-2.5 px-3 font-medium">Project</th>
                      <th className="py-2.5 px-3 font-medium">Amount</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Updated</th>
                      <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F0EA]">
                    {filteredProposals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-xs" style={{ color: '#8C8278' }}>
                              {proposals.length === 0 ? 'No proposals yet. Start by generating your first proposal.' : 'No proposals found matching your search.'}
                            </p>
                            {proposals.length === 0 && (
                              <Button onClick={handleNewProposalClick} variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
                                Create Proposal
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedProposals.map(prop => (
                        <tr
                          key={prop.id}
                          onClick={() => onOpenProposal(prop.id)}
                          className="hover:bg-[#F4F0EA] transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-[#1A1918] group-hover:text-[#82694E]">
                              <FileText className="w-3.5 h-3.5 text-[#8C8278]" />
                              <span>{prop.proposalNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={prop.clientName} size="sm" />
                              <span className="font-medium text-[#1A1918]">{prop.clientName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[#6E6E73]">
                            {prop.projectName || prop.title.replace(/^Proposal for /, '')}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#1A1918]">${prop.amount.toLocaleString()}</td>
                          <td className="py-3 px-3">
                            <Badge size="sm" variant={prop.status.toLowerCase() as any}>{prop.status}</Badge>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-[#8C8278]">
                            {new Date(prop.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === prop.id ? null : prop.id)}
                                className="p-1 text-[#8C8278] hover:text-[#1A1918] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
                                aria-label="Proposal actions"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {activeMenuId === prop.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                  <div className="fixed right-4 w-36 bg-white border border-[#EDE8E1] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100" style={{ top: 'auto', bottom: '80px' }}>
                                    <button onClick={() => { setActiveMenuId(null); onOpenProposal(prop.id); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#1A1918] hover:bg-[#F4F0EA] rounded-lg text-left cursor-pointer font-medium">
                                      <Edit2 className="w-3.5 h-3.5 text-[#8C8278]" /><span>Open & Edit</span>
                                    </button>
                                    {prop.status !== 'Accepted' && (
                                      <button onClick={async () => { setActiveMenuId(null); await onUpdateStatus(prop.id, 'Accepted'); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#248A3D] hover:bg-[#34C759]/10 rounded-lg text-left cursor-pointer font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" /><span>Accept</span>
                                      </button>
                                    )}
                                    <button onClick={() => { setActiveMenuId(null); setPendingDelete(prop); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg text-left cursor-pointer font-medium">
                                      <Trash2 className="w-3.5 h-3.5 text-[#FF3B30]" /><span>Delete</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-[#F4F0EA]">
                {filteredProposals.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs" style={{ color: '#8C8278' }}>
                        {proposals.length === 0 ? 'No proposals yet. Start by generating your first proposal.' : 'No proposals found matching your search.'}
                      </p>
                      {proposals.length === 0 && (
                        <Button onClick={handleNewProposalClick} variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
                          Create Proposal
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  paginatedProposals.map(prop => (
                    <div key={prop.id} onClick={() => onOpenProposal(prop.id)} className="p-3.5 hover:bg-[#F4F0EA] transition-colors cursor-pointer space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#8C8278]" />
                          <span className="font-mono font-medium text-xs text-[#1A1918]">{prop.proposalNumber}</span>
                        </div>
                        <Badge size="sm" variant={prop.status.toLowerCase() as any}>{prop.status}</Badge>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium text-xs text-[#1A1918] line-clamp-1">{prop.title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8C8278]">
                          <Avatar name={prop.clientName} size="sm" />
                          <span>{prop.clientName}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-0.5 text-xs">
                        <div>
                          <span className="text-[#8C8278] block text-[9px] uppercase font-medium">Value</span>
                          <span className="font-semibold text-xs text-[#1A1918]">${prop.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {prop.status !== 'Accepted' && (
                            <Button variant="secondary" size="xs" onClick={async () => await onUpdateStatus(prop.id, 'Accepted')}>Accept</Button>
                          )}
                          <Button variant="primary" size="xs" onClick={() => onOpenProposal(prop.id)}>Edit</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="px-4 py-2.5 bg-[#F4F0EA] border-t border-[#EDE8E1] flex items-center justify-between text-xs text-[#8C8278]">
                <span className="text-[11px]">Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProposals.length)} of {filteredProposals.length} proposals</span>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="xs" isIconOnly disabled={currentPage === 1} onClick={handlePrevPage} aria-label="Previous page"><ChevronLeft className="w-3 h-3" /></Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'secondary'}
                        size="xs"
                        className="w-6 h-6 p-0 text-[11px]"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="secondary" size="xs" isIconOnly disabled={currentPage === totalPages || totalPages === 0} onClick={handleNextPage} aria-label="Next page"><ChevronRight className="w-3 h-3" /></Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* No-client redirect popup */}
      <ConfirmDialog
        isOpen={showNoClientPrompt}
        onClose={() => setShowNoClientPrompt(false)}
        onConfirm={() => { setShowNoClientPrompt(false); onNavigateToClients(); }}
        tone="neutral"
        title="You need a client first"
        description="Every proposal must be addressed to a client. Head to Clients to add one, then come back to write your proposal."
        confirmLabel="Go to Clients"
        details={[]}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => { const prop = pendingDelete; setPendingDelete(null); if (prop) await onDeleteProposal(prop.id); }}
        tone="danger"
        title="Delete this proposal?"
        description="This permanently removes the proposal and all of its generated content from your workspace. This action cannot be undone."
        confirmLabel="Delete proposal"
        details={pendingDelete ? [
          { label: 'Proposal', value: pendingDelete.proposalNumber },
          { label: 'Client', value: pendingDelete.clientName },
          { label: 'Amount', value: `$${pendingDelete.amount.toLocaleString()}` }
        ] : []}
      />
    </div>
  );
};
