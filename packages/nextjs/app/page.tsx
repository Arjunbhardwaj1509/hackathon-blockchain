"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { AddressInput } from "~~/components/scaffold-eth";
// ---
// ⬇️ HERE ARE THE CORRECTED HOOK NAMES ⬇️
// ---
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [workerAddress, setWorkerAddress] = useState("");
  const [jobAmount, setJobAmount] = useState("");
  const [jobId, setJobId] = useState("");

  // ---
  // ⬇️ CORRECTED READ HOOK ⬇️
  // ---
  const { data: jobCounter } = useScaffoldReadContract({
    contractName: "InstaPay",
    functionName: "jobCounter",
    watch: true,
  });

  // ---
  // ⬇️ CORRECTED WRITE HOOK (for createAndFundJob) ⬇️
  // This hook pre-configures the write function
  // ---
  const { writeContractAsync: createJob, isPending: isCreating } = useScaffoldWriteContract("InstaPay");

  // ---
  // ⬇️ CORRECTED WRITE HOOK (for releasePayment) ⬇️
  // ---
  const { writeContractAsync: releasePayment, isPending: isReleasing } = useScaffoldWriteContract("InstaPay");

  const handleCreateJob = async () => {
    try {
      await createJob({
        functionName: "createAndFundJob",
        args: [workerAddress],
        value: jobAmount ? parseEther(jobAmount) : 0n,
      });
    } catch (e) {
      console.error("Error creating job:", e);
    }
  };

  const handleReleasePayment = async () => {
    try {
      await releasePayment({
        functionName: "releasePayment",
        args: [BigInt(jobId || 0)],
      });
    } catch (e) {
      console.error("Error releasing payment:", e);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="text-4xl font-bold">InstaPay Demo 💸</h1>
      <p className="text-lg">Instant Payments. No 14-day delays.</p>

      <div className="text-2xl mt-4">
        Total Jobs Created: <span className="font-bold text-green-500">{jobCounter?.toString() || 0}</span>
      </div>

      <div className="flex gap-10 mt-10">
        {/* HIRER CARD */}
        <div className="card w-96 bg-base-100 shadow-xl border border-gray-200">
          <div className="card-body">
            <h2 className="card-title">1. Create & Fund Job (Hirer)</h2>
            <label className="label">Worker&apos;s Wallet Address:</label>
            <AddressInput value={workerAddress} onChange={setWorkerAddress} />
            <label className="label">Amount (in ETH):</label>
            <input
              type="text"
              placeholder="e.g ., 0.1"
              className="input input-bordered w-full"
              value={jobAmount}
              onChange={e => setJobAmount(e.target.value)}
            />
            {/* ---
            // ⬇️ UPDATED BUTTON ⬇️
            // --- */}
            <button className="btn btn-primary mt-2" onClick={handleCreateJob} disabled={isCreating}>
              {isCreating ? <span className="loading loading-spinner"></span> : "Create & Fund"}
            </button>
          </div>
        </div>

        {/* PAYMENT CARD */}
        <div className="card w-96 bg-base-100 shadow-xl border border-gray-200">
          <div className="card-body">
            <h2 className="card-title">2. Release Payment (Hirer)</h2>
            <label className="label">Job ID to Pay:</label>
            <input
              type="text"
              placeholder="e.g., 1"
              className="input input-bordered w-full"
              value={jobId}
              onChange={e => setJobId(e.target.value)}
            />
            {/* ---
            // ⬇️ UPDATED BUTTON ⬇️
            // --- */}
            <button className="btn btn-success mt-2" onClick={handleReleasePayment} disabled={isReleasing}>
              {isReleasing ? <span className="loading loading-spinner"></span> : "Release Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
