import { ReactNode } from 'react'
import { IoCloseSharp } from 'react-icons/io5'


interface Props {
    title: string;
    message: string;
    isOpen: boolean;
    action: () => void;
    close: () => void;
    closeBtnText?: string;
    actionBtnText?: string;
}

export default function MessageModal({
                                         title,
                                         message,
                                         actionBtnText = 'Confirm',
                                         closeBtnText = 'Close',
                                         isOpen,
                                         action,
                                         close
                                     }: Props) {
    if (!isOpen) return <></>

    return (
        <div className="lg:px-0 fixed left-0 top-0 w-screen h-screen px-10  flex flex-col justify-center items-center bg-lul-black/90 z-40 antialiased" onClick={close}>

            {/*Modal*/}
            <div className="relative lg:w-1/3 w-full bg-lul-dark-grey rounded-md p-6 flex flex-col gap-y-8 font-white">
                {/*Close Button*/}
                <div className="absolute right-3 top-3 w-6 cursor-pointer" onClick={close}>
                    <IoCloseSharp className="w-full h-full right-3 top-3 text-lul-red"/>
                </div>


                {/*Title*/}
                <h1 className="flex justify-center items-center text-2xl font-bold">{title}</h1>

                {/*Message*/}
                <p className="text-lg">{message}</p>

                {/*Buttons*/}
                <div className="flex justify-center items-center gap-x-8">
                    <button onClick={close} className="uppercase text-sm font-bold bg-lul-red text-white py-2 px-4 rounded-md">{closeBtnText}</button>
                    <button onClick={action} className="uppercase text-sm font-bold bg-lul-blue text-white py-2 px-4 rounded-md">{actionBtnText}</button>
                </div>
            </div>

        </div>
    )
}