import * as React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);

const PasswordGate: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const { t } = useLanguage();
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '12314') {
            onSuccess();
        } else {
            setError(t('password_gate_error'));
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm mx-auto text-center">
                <div className="w-20 h-20 bg-slate-800 text-indigo-400 flex items-center justify-center rounded-full border-2 border-slate-700 mx-auto mb-6">
                    <LockIcon className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{t('password_gate_title')}</h1>
                <p className="text-slate-400 mb-6">{t('password_gate_prompt')}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        ref={inputRef}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('password_gate_placeholder')}
                        className="w-full p-4 text-center bg-slate-800 text-white rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                    {error && <p className="text-red-500 text-sm animate-shake">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-5 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {t('password_gate_submit')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordGate;