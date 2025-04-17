"use client";

import Image from "next/image";
import Link from "next/link";
import LoginForm from "./loginForm";

const LoginFormContainer = () => {
  return (
    <div className="w-full lg:grid lg:min-h-[calc(100svh-65px)] lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-muted-foreground text-balance">
              Enter your email below to login to your account
            </p>
          </div>

          <LoginForm />

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-muted hidden lg:block">
        <Image
          src="https://wallpapercave.com/wp/wp12164096.jpg"
          alt="Image"
          width="960"
          height="540"
          className="h-full w-full object-cover object-top dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default LoginFormContainer;
