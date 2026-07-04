export interface LogoPreset {
    id: string;
    name: string;
    iconBg: string;
    emoji: string;
}

export const LOGO_PRESETS: LogoPreset[] = [
    { id: 'piggy', name: 'Piggy Bank', iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-300', emoji: '🐷' },
    { id: 'vault', name: 'Vault', iconBg: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '🏦' },
    { id: 'coins', name: 'Coins', iconBg: 'bg-amber-100 text-amber-700 border-amber-300', emoji: '🪙' },
    { id: 'sprout', name: 'Growth', iconBg: 'bg-green-100 text-green-700 border-green-300', emoji: '🌱' },
    { id: 'star', name: 'Club', iconBg: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '⭐' },
    { id: 'heart', name: 'Friends', iconBg: 'bg-rose-100 text-rose-700 border-rose-300', emoji: '🤝' },
];
