import React, { useState } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { Project, Client, ProjectStatus, ProjectPriority } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  clients: Client[];
  onCreateProject: (project: Partial<Project>) => Promise<void>;
  onUpdateProject: (id: string, project: Partial<Project>) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  clients,
  onCreateProject,
  onUpdateProject,
  onUpdateStatus,
  onDeleteProject
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    clientId: clients[0]?.id || '',
    description: '',
    budget: 3500,
    priority: 'Medium' as ProjectPriority,
    status: 'To Do' as ProjectStatus,
    deadline: 'May 30, 2024'
  });

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const todoProjects = filteredProjects.filter(p => p.status === 'To Do');
  const inProgressProjects = filteredProjects.filter(p => p.status === 'In Progress');
  const completedProjects = filteredProjects.filter(p => p.status === 'Completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const client = clients.find(c => c.id === formData.clientId);
    const clientName = client ? client.name : 'Acme Corporation';

    if (editingProject) {
      await onUpdateProject(editingProject.id, {
        ...formData,
        clientName
      });
      setEditingProject(null);
    } else {
      await onCreateProject({
        ...formData,
        clientName
      });
    }

    setIsModalOpen(false);
  };

  const openCreateModal = (defaultStatus: ProjectStatus = 'To Do') => {
    setEditingProject(null);
    setFormData({
      title: '',
      clientId: clients[0]?.id || '',
      description: '',
      budget: 3500,
      priority: 'Medium',
      status: defaultStatus,
      deadline: 'Jun 15, 2024'
    });
    setIsModalOpen(true);
  };

  const getPriorityBadge = (priority: ProjectPriority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-[#FF3B30]/10 text-[#D70015] border border-[#FF3B30]/20">Urgent</span>;
      case 'High':
        return <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-[#FF9500]/10 text-[#C97100] border border-[#FF9500]/20">High</span>;
      case 'Medium':
        return <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">Medium</span>;
      default:
        return <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-[#8E8E93]/10 text-[#636366] border border-[#8E8E93]/20">Low</span>;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Projects</h1>
          <p className="text-xs text-[#8C8278] mt-0.5">
            Track active client deliverables, sprints, and project milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Apple Segmented View switcher */}
          <div className="segmented-control">
            <button
              onClick={() => setViewMode('board')}
              className={`px-2.5 py-1 text-[11px] rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'board' ? 'bg-white text-[#4A3F35] font-medium shadow-2xs' : 'text-[#7A6548] hover:text-[#5C4D35]'
                }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-[11px] rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-[#4A3F35] font-medium shadow-2xs' : 'text-[#7A6548] hover:text-[#5C4D35]'
                }`}
            >
              <List className="w-3 h-3" />
              <span>List</span>
            </button>
          </div>

          <Button
            onClick={() => openCreateModal('To Do')}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: To Do */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
                <h3 className="font-semibold text-xs text-[#1A1918]">To Do</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-black/[0.04] text-[#8C8278]">
                  {todoProjects.length}
                </span>
              </div>
              <button
                onClick={() => openCreateModal('To Do')}
                className="p-1 text-[#8C8278] hover:text-[#1A1918] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 flex-1">
              {todoProjects.map(proj => (
                <Card
                  key={proj.id}
                  padding="sm"
                  className="hover:border-[#E0D9CF] transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={proj.clientName} size="sm" />
                      <span className="text-[11px] text-[#8C8278] font-medium">{proj.clientName}</span>
                    </div>
                    {getPriorityBadge(proj.priority)}
                  </div>

                  <h4 className="font-semibold text-xs text-[#1A1918] group-hover:text-[#0071E3] transition-colors mb-1">
                    {proj.title}
                  </h4>
                  {proj.description && (
                    <p className="text-[11px] text-[#8C8278] line-clamp-2 mb-2">
                      {proj.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#F4F0EA] text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-[#8C8278]">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{proj.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[11px] text-[#1A1918]">${proj.budget.toLocaleString()}</span>
                      <button
                        onClick={() => onUpdateStatus(proj.id, 'In Progress')}
                        title="Move to In Progress"
                        className="p-1 text-[#8C8278] hover:text-[#0071E3] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              <button
                onClick={() => openCreateModal('To Do')}
                className="w-full py-2 px-3 border border-dashed border-[#EDE8E1] hover:border-[#1A1918] hover:bg-white rounded-xl text-xs font-medium text-[#8C8278] hover:text-[#1A1918] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Project</span>
              </button>
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0071E3]" />
                <h3 className="font-semibold text-xs text-[#1A1918]">In Progress</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-black/[0.04] text-[#8C8278]">
                  {inProgressProjects.length}
                </span>
              </div>
              <button
                onClick={() => openCreateModal('In Progress')}
                className="p-1 text-[#8C8278] hover:text-[#1A1918] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 flex-1">
              {inProgressProjects.map(proj => (
                <Card
                  key={proj.id}
                  padding="sm"
                  className="hover:border-[#E0D9CF] transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={proj.clientName} size="sm" />
                      <span className="text-[11px] text-[#8C8278] font-medium">{proj.clientName}</span>
                    </div>
                    {getPriorityBadge(proj.priority)}
                  </div>

                  <h4 className="font-semibold text-xs text-[#1A1918] group-hover:text-[#0071E3] transition-colors mb-1">
                    {proj.title}
                  </h4>
                  {proj.description && (
                    <p className="text-[11px] text-[#8C8278] line-clamp-2 mb-2">
                      {proj.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#F4F0EA] text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-[#8C8278]">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{proj.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[11px] text-[#1A1918]">${proj.budget.toLocaleString()}</span>
                      <button
                        onClick={() => onUpdateStatus(proj.id, 'Completed')}
                        title="Mark as Completed"
                        className="p-1 text-[#8C8278] hover:text-[#248A3D] hover:bg-[#34C759]/10 rounded-md transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              <button
                onClick={() => openCreateModal('In Progress')}
                className="w-full py-2 px-3 border border-dashed border-[#EDE8E1] hover:border-[#1A1918] hover:bg-white rounded-xl text-xs font-medium text-[#8C8278] hover:text-[#1A1918] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Project</span>
              </button>
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                <h3 className="font-semibold text-xs text-[#1A1918]">Completed</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-black/[0.04] text-[#8C8278]">
                  {completedProjects.length}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1">
              {completedProjects.map(proj => (
                <Card
                  key={proj.id}
                  padding="sm"
                  className="bg-white/80 hover:border-[#E0D9CF] transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={proj.clientName} size="sm" />
                      <span className="text-[11px] text-[#8C8278] font-medium">{proj.clientName}</span>
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20">
                      Completed
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-[#1A1918] mb-1">
                    {proj.title}
                  </h4>
                  {proj.description && (
                    <p className="text-[11px] text-[#8C8278] line-clamp-2 mb-2">
                      {proj.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#F4F0EA] text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-[#8C8278]">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{proj.deadline}</span>
                    </div>
                    <span className="font-semibold text-[11px] text-[#1A1918]">${proj.budget.toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <Card padding="none" className="overflow-hidden border border-[#EDE8E1]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F0EA] border-b border-[#EDE8E1] text-[11px] font-medium text-[#8C8278]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Project</th>
                  <th className="py-2.5 px-3 font-medium">Client</th>
                  <th className="py-2.5 px-3 font-medium">Deadline</th>
                  <th className="py-2.5 px-3 font-medium">Budget</th>
                  <th className="py-2.5 px-3 font-medium">Priority</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F0EA]">
                {filteredProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-[#F4F0EA] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#1A1918]">{proj.title}</td>
                    <td className="py-3 px-3 text-[#6E6E73]">{proj.clientName}</td>
                    <td className="py-3 px-3 text-[#8C8278]">{proj.deadline}</td>
                    <td className="py-3 px-3 font-medium text-[#1A1918]">${proj.budget.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      {getPriorityBadge(proj.priority)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge size="sm" variant={proj.status.toLowerCase() as any}>{proj.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                       <button
                         onClick={() => setPendingDelete(proj)}
                         className="p-1 text-[#8C8278] hover:text-[#FF3B30] rounded-md hover:bg-[#FF3B30]/10 transition-colors"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </Card>
       )}

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const proj = pendingDelete;
          setPendingDelete(null);
          if (proj) await onDeleteProject(proj.id);
        }}
        tone="danger"
        title="Delete this project?"
        description="This permanently removes the project, its tasks and milestones from your workspace. This action cannot be undone."
        confirmLabel="Delete project"
        details={pendingDelete ? [
          { label: 'Project', value: pendingDelete.title },
          { label: 'Client', value: pendingDelete.clientName },
          { label: 'Budget', value: `$${pendingDelete.budget.toLocaleString()}` }
        ] : []}
      />

      {/* New / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
        subtitle="Set up deliverables, client assignment, and project budget"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brand Identity Overhaul"
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Budget (USD)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Deadline
              </label>
              <input
                type="text"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                placeholder="Jun 20, 2024"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key project goals, deliverables, and scope notes..."
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
