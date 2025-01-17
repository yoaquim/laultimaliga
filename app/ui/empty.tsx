interface Props {
    message: string;
}

export default function Empty({message}: Props) {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <p className="w-full text-lg text-center text-white uppercase font-bold">{message}</p>
        </div>
    )

}