import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { UCULogo } from './UCULogo';

interface AccessRestrictedProps {
  requiredRoleDescription: string;
  userRole: string;
  onReturnToAllowed: () => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  requiredRoleDescription,
  userRole,
  onReturnToAllowed,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm relative overflow-hidden">
        {/* Brand hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#091E3A] via-[#E6007E] to-[#FFCC00]" />

        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider mb-3">
          <Lock className="w-3.5 h-3.5 text-rose-600" />
          Access Restricted • 403 Forbidden
        </div>

        <h2 className="text-2xl font-serif font-black text-[#091E3A] tracking-tight">
          Role Authorization Required
        </h2>

        <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          Your account is authenticated with the role{' '}
          <strong className="text-[#091E3A] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
            {userRole}
          </strong>
          . This module requires <strong className="text-slate-900">{requiredRoleDescription}</strong>.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs max-w-md mx-auto space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#0047AB]" />
            <span>Institutional Role-Based Access Control (RBAC)</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Uganda Christian University enforces strict separation of student financial records and staff accounting workstations.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={onReturnToAllowed}
            className="px-5 py-2.5 rounded-xl bg-[#091E3A] hover:bg-[#0047AB] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Your Authorized Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
