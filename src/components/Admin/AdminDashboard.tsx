import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Bot, Sparkles, Upload, RefreshCw, Save, CheckCircle2, 
  AlertTriangle, Volume2, Trash2, Edit3, Eye, FileCode, Layers, Search, 
  Lock, UserCheck, X, Box, ArrowRight
} from 'lucide-react';
import { TeamMember, UserAuth } from '../../types';
import { TEAM_MEMBERS } from '../../data/teamData';
import { NpcAvatar3DCanvas } from '../ThreeD/NpcAvatar3DCanvas';
import { speechService } from '../../lib/speech';
import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  isAdminEmail,
  signInWithPopup,
  googleProvider,
  ADMIN_EMAILS
} from '../../lib/firebase';

interface AdminDashboardProps {
  userAuth: UserAuth;
  onUpdateTeamMembers?: (members: TeamMember[]) => void;
  onTabChange?: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userAuth,
  onUpdateTeamMembers,
  onTabChange,
}) => {
  const [npcList, setNpcList] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [selectedNpc, setSelectedNpc] = useState<TeamMember | null>(TEAM_MEMBERS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isDraggingOverId, setIsDraggingOverId] = useState<string | null>(null);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userAuth.isAdmin || isAdminEmail(userAuth.email);

  // Real-time synchronization with Firestore collection 'npc_records'
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'npc_records'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreNpcs: TeamMember[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as TeamMember;
              firestoreNpcs.push({ ...data, id: docSnap.id });
            });

            // Merge with local defaults
            const merged = TEAM_MEMBERS.map((defaultMember) => {
              const found = firestoreNpcs.find((f) => f.id === defaultMember.id);
              return found ? { ...defaultMember, ...found } : defaultMember;
            });

            setNpcList(merged);
            onUpdateTeamMembers?.(merged);

            // Update currently selected NPC if matched
            setSelectedNpc((prev) => {
              if (!prev) return merged[0];
              const updated = merged.find((m) => m.id === prev.id);
              return updated || prev;
            });
          }
        },
        (err) => {
          console.warn('Firestore live listener notice (using local baseline):', err.message);
        }
      );

      return () => unsub();
    } catch (e) {
      console.warn('Could not attach Firestore listener:', e);
    }
  }, []);

  // Quick Seed / Sync all 9 default team members into Firestore
  const handleSeedRoster = async () => {
    if (!isAdmin) return;
    setIsSyncingFirestore(true);
    speechService.playSound('click');

    try {
      for (const member of TEAM_MEMBERS) {
        await setDoc(
          doc(db, 'npc_records', member.id),
          {
            ...member,
            updatedAt: new Date().toISOString(),
            updatedBy: userAuth.email || 'admin@novasoft.ai',
          },
          { merge: true }
        );
      }
      setSaveSuccessMsg('All 9 NPC records successfully initialized in Firestore!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to seed roster:', err);
      setDragError(`Error saving to Firestore: ${err?.message || 'Check database permissions'}`);
      setTimeout(() => setDragError(null), 5000);
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // Handle Drag & Drop of 3D GLB/GLTF model files
  const handleDropGlb = async (e: React.DragEvent, targetMember: TeamMember) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverId(null);
    setDragError(null);

    if (!isAdmin) {
      setDragError('Only authorized administrators can assign 3D models.');
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processAndAssignGlbFile(file, targetMember);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, targetMember: TeamMember) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndAssignGlbFile(file, targetMember);
  };

  const processAndAssignGlbFile = async (file: File, targetMember: TeamMember) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
      setDragError('Invalid file format. Please drop a valid 3D .glb or .gltf binary model.');
      setTimeout(() => setDragError(null), 4000);
      return;
    }

    // Check size (< 25MB recommended)
    if (file.size > 25 * 1024 * 1024) {
      setDragError('File exceeds 25MB limit. Please provide an optimized 3D GLB asset.');
      setTimeout(() => setDragError(null), 4000);
      return;
    }

    setIsSaving(true);
    speechService.playSound('click');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        const updatedRecord: Partial<TeamMember> = {
          glbModelData: base64Data,
          glbModelName: file.name,
          updatedAt: new Date().toISOString(),
          updatedBy: userAuth.email || 'admin@novasoft.ai',
        };

        // 1. Update local state immediately for instant feedback
        setNpcList((prev) =>
          prev.map((m) => (m.id === targetMember.id ? { ...m, ...updatedRecord } : m))
        );

        if (selectedNpc?.id === targetMember.id) {
          setSelectedNpc((prev) => (prev ? { ...prev, ...updatedRecord } : null));
        }

        // 2. Persist to Firestore
        try {
          await setDoc(doc(db, 'npc_records', targetMember.id), updatedRecord, { merge: true });
        } catch (dbErr: any) {
          console.warn('Firestore write warning:', dbErr);
        }

        speechService.playSound('complete');
        setSaveSuccessMsg(`Assigned 3D model "${file.name}" to ${targetMember.name}!`);
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      } catch (err: any) {
        setDragError(`Failed to process 3D model: ${err.message}`);
      } finally {
        setIsSaving(false);
      }
    };

    reader.onerror = () => {
      setDragError('Failed to read file from disk.');
      setIsSaving(false);
    };

    reader.readAsDataURL(file);
  };

  // Remove custom 3D model and revert to procedural archetype
  const handleRemoveGlb = async (targetMember: TeamMember) => {
    if (!isAdmin) return;
    speechService.playSound('click');
    setIsSaving(true);

    try {
      const resetData = {
        glbModelData: '',
        glbModelName: '',
        updatedAt: new Date().toISOString(),
        updatedBy: userAuth.email || 'admin@novasoft.ai',
      };

      setNpcList((prev) =>
        prev.map((m) => (m.id === targetMember.id ? { ...m, ...resetData } : m))
      );

      if (selectedNpc?.id === targetMember.id) {
        setSelectedNpc((prev) => (prev ? { ...prev, ...resetData } : null));
      }

      await setDoc(doc(db, 'npc_records', targetMember.id), resetData, { merge: true });
      setSaveSuccessMsg(`Reverted ${targetMember.name} to default 3D procedural avatar.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e: any) {
      console.warn('Revert error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (npc: TeamMember) => {
    setSelectedNpc(npc);
    setEditForm({ ...npc });
    setIsEditing(true);
    speechService.playSound('click');
  };

  // Save Edit Form to Firestore
  const handleSaveEdit = async () => {
    if (!selectedNpc || !isAdmin) return;
    setIsSaving(true);
    speechService.playSound('click');

    try {
      const updated = {
        ...editForm,
        updatedAt: new Date().toISOString(),
        updatedBy: userAuth.email || 'admin@novasoft.ai',
      };

      setNpcList((prev) =>
        prev.map((m) => (m.id === selectedNpc.id ? ({ ...m, ...updated } as TeamMember) : m))
      );

      setSelectedNpc((prev) => (prev ? ({ ...prev, ...updated } as TeamMember) : null));

      await setDoc(doc(db, 'npc_records', selectedNpc.id), updated, { merge: true });

      setIsEditing(false);
      speechService.playSound('complete');
      setSaveSuccessMsg(`Updated NPC profile for ${editForm.name}!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setDragError(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestVoice = (npc: TeamMember) => {
    speechService.playSound('click');
    speechService.speak(
      `Verification complete. I am ${npc.name}, ${npc.role}. Cognitive engine is ${npc.neuralModel || 'active'}.`,
      {
        speaker: npc.name,
        voiceName: (npc.voiceName as any) || 'Kore',
      }
    );
  };

  const filteredNpcs = npcList.filter((npc) => {
    const matchesSearch =
      npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'All' || npc.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const departments = ['All', 'Executive', 'Product & BA', 'Architecture', 'Engineering', 'Design', 'Quality & Security', 'DevOps & SRE', 'Support'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      {/* Top Banner & Admin Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              RESTRICTED CONSOLE
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400 font-mono">RBAC Security Layer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-8 h-8 text-indigo-400" />
            <span>AI Avatar & NPC Roster Operations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure autonomous agent profiles, assign custom 3D GLB models via drag-and-drop, and synchronize neural specifications with Firestore.
          </p>
        </div>

        {/* Admin Credential Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Authenticated Operator</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
              <span className="text-xs font-bold text-white font-mono">{userAuth.email || 'Guest Operator'}</span>
              <span className={`px-2 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${isAdmin ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950 text-rose-300 border border-rose-800/60'}`}>
                {isAdmin ? 'ADMIN' : 'CLIENT'}
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleSeedRoster}
              disabled={isSyncingFirestore}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-semibold font-mono uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
              title="Ensure all 9 members are saved to Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirestore ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Sync Firestore</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Warning if not Admin */}
      {!isAdmin && (
        <div className="mb-8 p-5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Read-Only Demonstration Mode</h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Designated administrators (<code className="text-amber-200 font-mono">bhongong@gmail.com</code> & <code className="text-amber-200 font-mono">calixto.ongii@gmail.com</code>) have write permissions to assign 3D GLB models and update NPC records.
              </p>
            </div>
          </div>
          <button
            onClick={() => onTabChange?.('home')}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Return to Site</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alerts / Success Feedback */}
      {saveSuccessMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2.5 animate-fadeIn shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {dragError && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{dragError}</span>
        </div>
      )}

      {/* Main Layout: Left List & 3D Dropzone / Right Live 3D Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: NPC Records Grid & Quick Drop Targets (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Bar: Search & Department Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AI roles or names..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {departments.slice(0, 5).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                    filterDept === dept
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* NPC Records Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNpcs.map((npc) => {
              const hasCustomGlb = Boolean(npc.glbModelData || npc.glbModelUrl);
              const isSelected = selectedNpc?.id === npc.id;
              const isDragging = isDraggingOverId === npc.id;

              return (
                <div
                  key={npc.id}
                  onClick={() => {
                    setSelectedNpc(npc);
                    speechService.playSound('click');
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverId(npc.id);
                  }}
                  onDragLeave={() => setIsDraggingOverId(null)}
                  onDrop={(e) => handleDropGlb(e, npc)}
                  className={`relative cursor-pointer p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                    isDragging
                      ? 'border-indigo-400 ring-2 ring-indigo-500 bg-indigo-950/60 scale-102 shadow-[0_0_25px_rgba(99,102,241,0.4)]'
                      : isSelected
                      ? 'border-indigo-400 bg-slate-900/80 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/40'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Drag overlay prompt */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-indigo-950/90 rounded-xl z-30 flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-400 animate-pulse text-center">
                      <Upload className="w-8 h-8 text-indigo-300 animate-bounce mb-2" />
                      <span className="text-xs font-bold text-white">Drop .GLB 3D Model Here</span>
                      <span className="text-[10px] text-indigo-200 mt-1">Assigns custom mesh to {npc.name}</span>
                    </div>
                  )}

                  <div>
                    {/* Top Row: Avatar thumbnail & Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-500/30 flex-shrink-0">
                        <img referrerPolicy="no-referrer" src={npc.avatarUrl} alt={npc.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded bg-slate-950/90 text-[7px] font-mono text-indigo-300 font-bold">
                          {npc.isHuman ? 'HUMAN' : 'AI'}
                        </span>
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-white truncate">{npc.name}</h3>
                          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider">{npc.department}</span>
                        </div>
                        <p className="text-xs text-indigo-300 font-medium truncate">{npc.role}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{npc.neuralModel || 'Executive'}</p>
                      </div>
                    </div>

                    {/* 3D Model Status Badge */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-3 text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-indigo-400" />
                        <span>3D MODEL:</span>
                      </span>
                      {hasCustomGlb ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{npc.glbModelName || 'Custom .GLB'}</span>
                        </span>
                      ) : (
                        <span className="text-indigo-300">Procedural 3D Mesh</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(npc);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                      title="Test Gemini Voice"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(npc);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {hasCustomGlb && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveGlb(npc);
                              }}
                              className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors"
                              title="Revert to procedural 3D model"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Interactive 3D Model Inspector & Drag & Drop Target (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          {selectedNpc ? (
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 shadow-2xl backdrop-blur-md space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white">{selectedNpc.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950 border border-indigo-800 text-indigo-300 uppercase">
                      {selectedNpc.isHuman ? 'Human Leader' : 'AI Avatar'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 font-medium">{selectedNpc.role}</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{selectedNpc.department} Dept · Station {selectedNpc.deskId}</p>
                </div>

                <button
                  onClick={() => handleTestVoice(selectedNpc)}
                  className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
                  title="Speak Sample"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Voice</span>
                </button>
              </div>

              {/* 3D Viewport with Orbit Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
                    <Box className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Real-Time 3D Model Viewport</span>
                  </span>
                  <span className="text-[9px] text-slate-500">Drag to rotate · Scroll to zoom</span>
                </div>

                <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                  <NpcAvatar3DCanvas
                    member={selectedNpc}
                    className="w-full h-full"
                    enableControls={true}
                    autoRotate={true}
                    interactive={true}
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Zone for GLB */}
              {isAdmin ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverId(selectedNpc.id);
                  }}
                  onDragLeave={() => setIsDraggingOverId(null)}
                  onDrop={(e) => handleDropGlb(e, selectedNpc)}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all text-center ${
                    isDraggingOverId === selectedNpc.id
                      ? 'border-indigo-400 bg-indigo-950/70 scale-102'
                      : 'border-slate-800 bg-slate-950/60 hover:border-indigo-500/50'
                  }`}
                >
                  <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-2 animate-pulse" />
                  <div className="text-xs font-bold text-white">Drag & Drop 3D GLB Model</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Drop any <code className="text-indigo-300 font-mono">.glb</code> file here to update {selectedNpc.name.split(' ')[0]}'s 3D avatar across the org chart & chat rooms.
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold font-mono uppercase tracking-wider transition-colors shadow-md"
                    >
                      Browse GLB File
                    </button>

                    {selectedNpc.glbModelData && (
                      <button
                        onClick={() => handleRemoveGlb(selectedNpc)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-300 text-[11px] font-mono transition-colors"
                      >
                        Revert to Default
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => handleFileInputChange(e, selectedNpc)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 text-center">
                  Sign in with an administrator account to upload custom 3D GLB assets.
                </div>
              )}

              {/* Bio & Specialties */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-widest">
                  Cognitive Persona & Backstory
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {selectedNpc.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedNpc.specialties.map((spec, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 text-[10px] font-mono">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 font-mono text-xs">
              Select an NPC record to inspect their 3D model.
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal for NPC Record */}
      {isEditing && selectedNpc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Edit NPC Record: {selectedNpc.name}</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Role Title</label>
                <input
                  type="text"
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Cognitive Engine / Model</label>
                  <input
                    type="text"
                    value={editForm.neuralModel || ''}
                    onChange={(e) => setEditForm({ ...editForm, neuralModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Gemini TTS Voice</label>
                  <select
                    value={editForm.voiceName || 'Kore'}
                    onChange={(e) => setEditForm({ ...editForm, voiceName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Kore">Kore (Smooth & Executive)</option>
                    <option value="Fenrir">Fenrir (Authoritative & Deep)</option>
                    <option value="Charon">Charon (Technical & Crisp)</option>
                    <option value="Zephyr">Zephyr (Clear & Articulate)</option>
                    <option value="Puck">Puck (Creative & Expressive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Bio / Capabilities Summary</label>
                <textarea
                  rows={3}
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save to Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
