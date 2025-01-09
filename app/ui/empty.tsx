interface Props {
    message: string;
}

export default function Empty({message}: Props) {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <p className="text-lg text-white">{message}</p>
        </div>
    )

}