export default function Shimmer() {
    return (
        <div className="w-full h-full relative overflow-hidden bg-lul-grey/20 rounded-md">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer"></div>
        </div>
    )
}
