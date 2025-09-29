import Image from "next/image";

const LoginPage = () => {
    return ( 

        <div className="grid h-full grid-cols-2">

         {/* DIREITA */}

        <div className="relative w-full h-full">
            <Image src="/login.png" alt="Logo" fill className="object-cover"/>

        </div>
                


       

        </div>

       

     );
}
 
export default LoginPage;