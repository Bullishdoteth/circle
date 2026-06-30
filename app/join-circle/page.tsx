'use client';

import { useState } from 'react';
import { ArrowRight, Users } from 'lucide-react';

export default function InvitationPage() {
    const [code, setCode] = useState('');

    const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!code.trim()) return;

        console.log('Invitation Code:', code);

        // TODO:
        // Validate code
        // Call API
        // Redirect user into the circle
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-lg border border-slate-200 p-8">
            <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <Users className="h-8 w-8 text-blue-600" />
            </div>
            </div>

            <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">
                Join a Circle
            </h1>

            <p className="mt-2 text-sm text-slate-500">
                Enter the invitation code shared with you to become a member.
            </p>
            </div>

            <form onSubmit={handleJoin} className="mt-8 space-y-5">
            <div>
                <label
                htmlFor="invite-code"
                className="mb-2 block text-sm font-medium text-slate-700"
                >
                Invitation Code
                </label>

                <input
                id="invite-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCD-1234"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg tracking-widest uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>

            <button
                type="submit"
                disabled={!code.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Join Circle
                <ArrowRight className="h-4 w-4" />
            </button>
            </form>

            <div className="mt-8 rounded-xl bg-slate-100 p-4">
            <p className="text-center text-sm text-slate-600">
                Don&apos;t have an invitation?
            </p>

            <button
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Create Your Own Circle
            </button>
            </div>
        </div>
        </main>
    );
}