"use client";

import { ContractExplorer } from "@/components/contract-explorer";

interface Props {
  params: {
    id: string;
  };
}

export default function ContractPage({ params }: Props) {
  return <ContractExplorer initialContractId={params.id} />;
}
