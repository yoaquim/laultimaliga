export default function Dots() {
    return (
        <div className="w-full h-full flex justify-center gap-x-2 items-center">
            <span className="sr-only">Loading...</span>
            <div className="w-[20%] h-[20%] bg-white opacity-75 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-[20%] h-[20%] bg-white opacity-75 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-[20%] h-[20%] bg-white opacity-75 rounded-full animate-bounce"></div>
        </div>
    )
}
