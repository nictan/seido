import { Award, Hash } from "lucide-react";

import { DOJOS } from "@/types/database";
import HayashiLogo from "@/assets/hayashiha-Logo2.jpg";

export const MembershipCard = ({ profile }: { profile: any }) => {


    const getRankColor = (rank: string) => {
        if (!rank) return "text-white";
        const r = rank.toLowerCase();
        if (r.includes("black")) return "text-yellow-500";
        if (r.includes("brown")) return "text-amber-800";
        if (r.includes("purple")) return "text-purple-500";
        if (r.includes("green")) return "text-green-500";
        if (r.includes("blue")) return "text-blue-500";
        return "text-white";
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not Set";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="relative w-full max-w-[600px] mx-auto aspect-[1.586] perspective-1000 group">
            {/* Front of Card */}
            <div className="absolute inset-0 w-full h-full transition-all duration-700 bg-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden border border-white/10">
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Gold Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                {/* Content Container */}
                <div className="relative h-full p-8 flex flex-col justify-between">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg p-2.5">
                                <img src={HayashiLogo} alt="Seido Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-wider">HAYASHI-HA KARATE SG</h2>
                                <p className="text-xs text-white/50 uppercase tracking-[0.2em]">{profile.karate_profile ? DOJOS[profile.karate_profile.dojo as keyof typeof DOJOS] : 'MEMBERSHIP'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">MEMBER STATUS</div>
                            <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                                ACTIVE
                            </div>
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex justify-between items-end mb-4">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Name</p>
                                <h1 className="text-3xl font-bold text-white tracking-wide">
                                    {profile.first_name} <span className="text-yellow-500">{profile.last_name}</span>
                                </h1>
                            </div>

                            <div className="flex gap-8">
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current Rank</p>
                                    <div className={`flex items-center gap-2 font-bold ${getRankColor(profile.rank_histories?.find((h: any) => h.isCurrent)?.rank?.displayName || profile.rank_histories?.[0]?.rank?.displayName)}`}>
                                        <Award className="w-4 h-4" />
                                        {profile.rank_histories?.find((h: any) => h.isCurrent)?.rank?.displayName || profile.rank_histories?.[0]?.rank?.displayName || 'White Belt'}
                                    </div>
                                    <p className="text-xs text-white/30 mt-1">
                                        Since {formatDate(profile.rank_histories?.find((h: any) => h.isCurrent)?.effectiveDate || profile.rank_histories?.[0]?.effectiveDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">ID Number</p>
                                    <div className="flex items-center gap-2 text-white font-mono">
                                        <Hash className="w-4 h-4 text-white/30" />
                                        {profile.id.slice(-8).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/30 font-mono">
                        <div>HAYASHI-HA SHITORYUKAI KARATE-DO (SINGAPORE)</div>
                        <div>VALID THRU: 12/26</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
