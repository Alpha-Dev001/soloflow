import React, { useState } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Calendar,
  Briefcase
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
}

export const ProposalsPage: React.FC<ProposalsPageProps> = ({
  proposals,
  clients,
  isLoading = false,
  onNewProposal,
  onOpenProposal,
  onUpdateStatus,
  onDeleteProposal
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Proposal | null>(null);

  const filteredProposals = proposals.filter(p => {
    const matchesSearch =
      p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & New Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Proposals</h1>
          <p className="text-xs text-[#8C8278] mt-0.5">
            Generate AI-powered proposals, pitch projects, and win contracts.
          </p>
        </div>

        <Button
          onClick={onNewProposal}
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          New Proposal
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8C8278] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search proposals..."
            className="w-full bg-white text-xs text-[#1A1918] placeholder-[#8C8278] pl-8.5 pr-3 py-1.5 rounded-lg border border-[#EDE8E1] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 transition-all"
          />
        </div>

        {/* Apple Segmented Control */}
        <div className="segmented-control self-start sm:self-auto overflow-x-auto max-w-full">
          {['All', 'Sent', 'Viewed', 'Accepted', 'Draft', 'Expired'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer whitespace-nowrap ${statusFilter === st ? 'bg-white text-[#4A3F35] font-medium shadow-2xs' : 'text-[#7A6548] hover:text-[#5C4D35]'
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        /* Proposals Table Card */
        <Card padding="none" className="overflow-hidden border border-[#EDE8E1]">
          {/* Desktop Table View */}
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
                    <td colSpan={7} className="py-10 text-center text-xs text-[#8C8278]">
                      No proposals found. Click "New Proposal" to generate one.
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map(prop => (
                    <tr
                      key={prop.id}
                      onClick={() => onOpenProposal(prop.id)}
                      className="hover:bg-[#F4F0EA] transition-colors cursor-pointer group"
                    >
                      {/* Proposal Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-[#1A1918] group-hover:text-[#6B5A3E]">
                          <FileText className="w-3.5 h-3.5 text-[#8C8278]" />
                          <span>{prop.proposalNumber}</span>
                        </div>
                      </td>

                      {/* Client Name + Avatar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={prop.clientName} size="sm" />
                          <span className="font-medium text-[#1A1918]">{prop.clientName}</span>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-3 text-[#6E6E73]">
                        {prop.projectName || prop.title.replace(/^Proposal for /, '')}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-medium text-[#1A1918]">
                        ${prop.amount.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge size="sm" variant={prop.status.toLowerCase() as any}>
                          {prop.status}
                        </Badge>
                      </td>

                      {/* Updated date */}
                      <td className="py-3 px-3 text-[11px] text-[#8C8278]">
                        {new Date(prop.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right relative"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === prop.id ? null : prop.id)}
                          className="p-1 text-[#8C8278] hover:text-[#1A1918] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
                          aria-label="Proposal actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuId === prop.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-4 mt-1 w-36 bg-white border border-[#EDE8E1] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenProposal(prop.id);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#1A1918] hover:bg-[#F4F0EA] rounded-lg text-left cursor-pointer font-medium"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#8C8278]" />
                                <span>Open & Edit</span>
                              </button>

                              {prop.status !== 'Accepted' && (
                                <button
                                  onClick={async () => {
                                    setActiveMenuId(null);
                                    await onUpdateStatus(prop.id, 'Accepted');
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#248A3D] hover:bg-[#34C759]/10 rounded-lg text-left cursor-pointer font-medium"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                              )}

                               <button
                                 onClick={() => {
                                   setActiveMenuId(null);
                                   setPendingDelete(prop);
                                 }}
                                 className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg text-left cursor-pointer font-medium"
                               >
                                 <Trash2 className="w-3.5 h-3.5 text-[#FF3B30]" />
                                 <span>Delete</span>
                               </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Stacked Card View */}
          <div className="md:hidden divide-y divide-[#F4F0EA]">
            {filteredProposals.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-[#8C8278]">
                No proposals found. Click "New Proposal" to generate one.
              </div>
            ) : (
              filteredProposals.map(prop => (
                <div
                  key={prop.id}
                  onClick={() => onOpenProposal(prop.id)}
                  className="p-3.5 hover:bg-[#F4F0EA] transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#8C8278]" />
                      <span className="font-mono font-medium text-xs text-[#1A1918]">{prop.proposalNumber}</span>
                    </div>
                    <Badge size="sm" variant={prop.status.toLowerCase() as any}>
                      {prop.status}
                    </Badge>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-medium text-xs text-[#1A1918] line-clamp-1">
                      {prop.title}
                    </div>
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
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={async () => await onUpdateStatus(prop.id, 'Accepted')}
                        >
                          Accept
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => onOpenProposal(prop.id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-2.5 bg-[#F4F0EA] border-t border-[#EDE8E1] flex items-center justify-between text-xs text-[#8C8278]">
            <span className="text-[11px]">
              Showing 1–{filteredProposals.length} of {proposals.length} proposals
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="xs"
                isIconOnly
                disabled
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="primary"
                size="xs"
                className="w-6 h-6 p-0 text-[11px]"
              >
                1
              </Button>
              <Button
                variant="secondary"
                size="xs"
                isIconOnly
                disabled
                aria-label="Next page"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
           </div>
         </Card>
       )}

      {/* Delete Proposal Confirmation */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const prop = pendingDelete;
          setPendingDelete(null);
          if (prop) await onDeleteProposal(prop.id);
        }}
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
