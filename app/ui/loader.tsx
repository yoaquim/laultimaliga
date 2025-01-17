import Shimmer from '@/ui/shimmer'

export default function Loader({full = false}: { full?: boolean }) {
    return (
        <div className="relative w-full h-full flex flex-col justify-center items-center">
            {full &&
                <div className="w-full h-2">
                    <Shimmer/>
                </div>
            }
            {!full &&
                <div className="lg:w-2/3 w-5/6 h-2">
                    <Shimmer/>
                </div>
            }
        </div>
    )
}