"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
const queryClient = new QueryClient()
export default function QueryClientProviderImpl(props: React.PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
}