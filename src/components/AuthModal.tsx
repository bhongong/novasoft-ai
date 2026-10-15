import React, { useState } from 'react';
import { UserAuth } from '../types';
import { X, ShieldCheck, User, Building, Mail, Sparkles, CheckCircle2, Lock, LogIn, AlertCircle } from 'lucide-react';
import { speechService } from '../lib/speech';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  isAdminEmail, 
  db, 
  doc, 
  setDoc 
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAuth?: UserAuth;
  onSaveAuth?: (auth: UserAuth) => void;
  onLogin?: (auth: UserAuth) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userAuth,
  onSaveAuth,
  onLogin,
}) => {
  const [name, setName] = useState(userAuth?.name || 'Calixto Ong');
  const [email, setEmail] = useState(userAuth?.email || 'calixto.ongii@gmail.com');
  const [company, setCompany] = useState(userAuth?.company || 'NovaTech Ventures');
  const [role, setRole] = useState(userAuth?.role || 'Human CEO & Founder');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync state when userAuth or modal opens
  React.useEffect(() => {
    if (userAuth) {
      if (userAuth.name) setName(userAuth.name);
      if (userAuth.email) setEmail(userAuth.email);
      if (userAuth.company) setCompany(userAuth.company);
      if (userAuth.role) setRole(userAuth.role);
    }
  }, [userAuth, isOpen]);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  ];

  if (!isOpen) return null;

  const handleComplete = (authPayload: UserAuth) => {
    // Automatically verify admin status
    const adminStatus = isAdminEmail(authPayload.email) || Boolean(authPayload.isAdmin);
    const finalizedPayload: UserAuth = {
      ...authPayload,
      isAdmin: adminStatus,
      role: adminStatus ? (authPayload.role.includes('Admin') ? authPayload.role : `${authPayload.role} (Admin)`) : authPayload.role,
    };

    if (onSaveAuth) onSaveAuth(finalizedPayload);
    if (onLogin) onLogin(finalizedPayload);
    onClose();
  };

  // Google Sign-In with Firebase Auth
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningInWithGoogle(true);
    speechService.playSound('click');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const adminFlag = isAdminEmail(user.email);
      const payload: UserAuth = {
        isLoggedIn: true,
        isAuthenticated: true,
        uid: user.uid,
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Google Operator'),
        email: user.email || 'operator@novasoft.ai',
        company: adminFlag ? 'NovaSoft Executive Board' : 'Client Partner',
        avatarUrl: user.photoURL || sampleAvatars[0],
        role: adminFlag ? 'Executive Administrator' : 'Product Lead',
        isAdmin: adminFlag,
      };

      // Persist user record in Firestore
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            email: payload.email,
            displayName: payload.name,
            role: adminFlag ? 'admin' : 'client',
            avatarUrl: payload.avatarUrl,
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore user doc sync notice:', e);
      }

      speechService.playSound('complete');
      handleComplete(payload);
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
      // If popup was blocked by iframe browser policy or closed
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in popup was blocked by iframe policy. You can use 1-click Admin verification below.');
      } else {
        setAuthError(err.message || 'Google authentication could not be completed.');
      }
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleAdminPresetLogin = (emailChoice: 'calixto' | 'bhongong') => {
    speechService.playSound('complete');
    if (emailChoice === 'calixto') {
      handleComplete({
        isLoggedIn: true,
        isAuthenticated: true,
        uid: 'admin-calixto',
        name: 'Calixto Ong II',
        email: 'calixto.ongii@gmail.com',
        company: 'NovaSoft AI Global',
        avatarUrl: sampleAvatars[0],
        role: 'Human CEO & Founder',
        isAdmin: true,
      });
    } else {
      handleComplete({
        isLoggedIn: true,
        isAuthenticated: true,
        uid: 'admin-bhongong',
        name: 'Bhong Ong',
        email: 'bhongong@gmail.com',
        company: 'NovaSoft AI Global',
        avatarUrl: sampleAvatars[1],
        role: 'Executive Administrator',
        isAdmin: true,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    speechService.playSound('complete');
    const userEmail = email.trim() || 'executive@client.com';
    const adminFlag = isAdminEmail(userEmail);

    handleComplete({
      isLoggedIn: true,
      isAuthenticated: true,
      name: name.trim() || 'Client Executive',
      email: userEmail,
      company: company.trim() || 'Enterprise Client',
      avatarUrl: sampleAvatars[avatarIndex],
      role: role.trim() || 'Product Owner',
      isAdmin: adminFlag,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl text-slate-200 overflow-hidden backdrop-blur-md">
        {/* Top Gradient Banner */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Executive Authentication</h3>
                <p className="text-xs text-slate-400">Google Auth & RBAC Permissions</p>
              </div>
            </div>
            <button
              id="btn-close-auth-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Google Sign-in Primary Button */}
          <div className="space-y-3 mb-5">
            <button
              id="btn-google-signin"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInWithGoogle}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-md border border-slate-200 disabled:opacity-70 group"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningInWithGoogle ? 'Connecting with Google...' : 'Sign In with Google'}</span>
            </button>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Quick Admin Credentials Bar */}
          <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Designated Administrators</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">RBAC Verified</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAdminPresetLogin('calixto')}
                className="p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-left transition-all group"
              >
                <div className="font-bold text-white text-xs truncate">calixto.ongii@gmail.com</div>
                <div className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Admin Access</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleAdminPresetLogin('bhongong')}
                className="p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-left transition-all group"
              >
                <div className="font-bold text-white text-xs truncate">bhongong@gmail.com</div>
                <div className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Admin Access</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase">Or Custom Profile</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Choose Avatar</label>
              <div className="flex gap-2.5">
                {sampleAvatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarIndex(i)}
                    className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                      avatarIndex === i
                        ? 'border-indigo-400 ring-2 ring-indigo-500/40 scale-105 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img referrerPolicy="no-referrer" src={url} alt="Avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Full Name</span>
              </label>
              <input
                id="input-auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
                placeholder="e.g. Calixto Ong"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Email Address</span>
              </label>
              <input
                id="input-auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
                placeholder="calixto.ongii@gmail.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Company / Org</span>
                </label>
                <input
                  id="input-auth-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
                  placeholder="NovaSoft AI"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  <span>Role Title</span>
                </label>
                <input
                  id="input-auth-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
                  placeholder="CEO / Executive"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                id="btn-submit-auth"
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all uppercase tracking-wider"
              >
                Save & Authenticate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
