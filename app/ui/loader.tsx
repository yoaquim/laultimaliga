import Shimmer from '@/ui/shimmer'

export default function Loader() {
    return (
        <div className="relative w-full h-full flex flex-col justify-center items-center">
            <div className="lg:w-1/3 w-5/6 h-2">
                <Shimmer/>
            </div>
        </div>
    )
}