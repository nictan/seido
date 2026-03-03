import { Award, Hash, Mail, Phone, Calendar, User as UserIcon } from "lucide-react";

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

    const dojoKey = profile.karate_profile?.dojo as keyof typeof DOJOS;
    const dojoLabel = dojoKey ? DOJOS[dojoKey] : null;

    const currentRank = profile.rank_histories?.find((h: any) => h.isCurrent) || profile.rank_histories?.[0];

    return (
        <div className="relative w-full max-w-[600px] mx-auto perspective-1000 group">
            {/* Front of Card */}
            <div className="relative w-full bg-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden border border-white/10">
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Gold Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                {/* Content Container */}
                <div className="relative p-8 flex flex-col gap-5">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg p-2.5">
                                <img src={HayashiLogo} alt="Seido Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-wider">HAYASHI-HA KARATE SG</h2>
                                {dojoLabel && (
                                    <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
                                        <span className="text-white/30">Dojo: </span>{dojoLabel}
                                    </p>
                                )}
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

                    {/* Name & Rank Row */}
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-xs text-white/40 uppercase tracking-widest">Name</p>
                            <h1 className="text-3xl font-bold text-white tracking-wide">
                                {profile.first_name} <span className="text-yellow-500">{profile.last_name}</span>
                            </h1>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-xs text-white/40 uppercase tracking-widest">Current Rank</p>
                            <div className={`flex items-center gap-2 font-bold justify-end ${getRankColor(currentRank?.rank?.displayName)}`}>
                                <Award className="w-4 h-4" />
                                {currentRank?.rank?.displayName || 'White Belt'}
                            </div>
                            <p className="text-xs text-white/30">
                                Since {formatDate(currentRank?.effectiveDate)}
                            </p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-2 border-t border-white/10">
                        {profile.email && (
                            <div className="flex items-center gap-2 min-w-0">
                                <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Email</p>
                                    <p className="text-xs text-white/80 font-mono truncate">{profile.email}</p>
                                </div>
                            </div>
                        )}
                        {profile.mobile && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Mobile</p>
                                    <p className="text-xs text-white/80 font-mono">{profile.mobile}</p>
                                </div>
                            </div>
                        )}
                        {profile.date_of_birth && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Date of Birth</p>
                                    <p className="text-xs text-white/80 font-mono">{formatDate(profile.date_of_birth)}</p>
                                </div>
                            </div>
                        )}
                        {profile.gender && (
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Gender</p>
                                    <p className="text-xs text-white/80 font-mono">{profile.gender}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-white/30 font-mono">
                        <div>HAYASHI-HA SHITORYUKAI KARATE-DO (SINGAPORE)</div>
                        <div className="flex items-center gap-1.5">
                            <Hash className="w-3 h-3 text-white/20" />
                            <span className="tracking-widest">{profile.id?.slice(-8).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
