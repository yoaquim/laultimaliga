export default function Spinner() {
    return (
        <div className="flex py-1 space-x-2 justify-center items-center">
            <span className="sr-only">Loading...</span>
            <div className="h-3 w-3 bg-white opacity-75 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-3 w-3 bg-white opacity-75 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-3 w-3 bg-white opacity-75 rounded-full animate-bounce"></div>
        </div>
    )
}
