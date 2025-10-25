"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";
// ---
// ⬇️ HERE ARE THE CORRECTED HOOK NAMES ⬇️
// ---
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [workerAddress, setWorkerAddress] = useState("");
  const [jobAmount, setJobAmount] = useState("");
  const [jobId, setJobId] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // --- NEW STATE ---
  // Stores the address that successfully created the *last* job
  const [jobCreatedByAddress, setJobCreatedByAddress] = useState<string | null>(null);
  const [lastCreatedJobId, setLastCreatedJobId] = useState<string | null>(null);

  // --- WAGMI HOOK ---
  // Gets the currently connected wallet address
  const { address: connectedAddress } = useAccount();

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

  // Generate floating particles effect
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const handleCreateJob = async () => {
    // Store the address *before* sending the transaction
    const addressCreatingJob = connectedAddress;
    if (!addressCreatingJob) {
      alert("Wallet not connected!");
      return;
    }

    // Validate inputs
    if (!workerAddress) {
      alert("Please enter a worker address!");
      return;
    }
    if (!jobAmount || parseFloat(jobAmount) <= 0) {
      alert("Please enter a valid amount greater than 0!");
      return;
    }

    setIsAnimating(true);
    try {
      await createJob(
        {
          functionName: "createAndFundJob",
          args: [workerAddress],
          value: jobAmount ? parseEther(jobAmount) : 0n,
        },
        // --- NEW: Add callbacks ---
        {
          // This runs *after* the transaction is successful
          onSuccess: async data => {
            console.log("Transaction successful:", data);
            // Save the address that *successfully* created this job
            setJobCreatedByAddress(addressCreatingJob);
            // We assume the new job ID is the current counter
            const newJobId = jobCounter ? (jobCounter + 1n).toString() : "1";
            setLastCreatedJobId(newJobId);
            setJobId(newJobId); // Automatically fill the Job ID for release
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            alert(
              `🎉 Job ${newJobId} created successfully!\n\nCreated by: ${addressCreatingJob}\nAmount: ${jobAmount} ETH\nWorker: ${workerAddress}`,
            );
          },
          onError(error) {
            console.error("Transaction error:", error);
            alert(`❌ Error creating job: ${error.message}`);
          },
        },
      );
    } catch (e) {
      console.error("Error setting up create job transaction:", e);
      alert(`❌ Setup Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleReleasePayment = async () => {
    // --- IMPROVED CHECK ---
    if (!connectedAddress) {
      alert("Wallet not connected!");
      return;
    }

    // Check if job ID is provided
    if (!jobId || jobId === "0") {
      alert("Please enter a valid Job ID to release payment.");
      return;
    }

    // More flexible validation - only check if we have stored creator info
    if (jobCreatedByAddress && lastCreatedJobId === jobId) {
      if (connectedAddress.toLowerCase() !== jobCreatedByAddress.toLowerCase()) {
        const proceed = confirm(
          `⚠️ Wallet Mismatch Warning!\n\n` +
            `This job (#${lastCreatedJobId}) was created by: ${jobCreatedByAddress}\n` +
            `You are currently connected as: ${connectedAddress}\n\n` +
            `Do you want to proceed anyway? This might fail if you're not the job creator.`,
        );
        if (!proceed) {
          return;
        }
      }
    }

    setIsAnimating(true);
    try {
      await releasePayment(
        {
          functionName: "releasePayment",
          args: [BigInt(jobId || 0)],
        },
        {
          onSuccess: async data => {
            console.log("Payment released successfully:", data);
            // Reset the creator address after successful payment
            setJobCreatedByAddress(null);
            setLastCreatedJobId(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            alert(`Payment for Job #${jobId} released successfully!`);
          },
          onError(error) {
            console.error("Transaction error:", error);
            alert(`Error releasing payment: ${error.message}`);
          },
        },
      );
    } catch (e) {
      console.error("Error releasing payment:", e);
      alert(`Error releasing payment: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-semibold">Success!</div>
              <div className="text-sm opacity-90">Transaction completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 animate-bounce">
            <span className="text-4xl animate-spin-slow">💸</span>
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            InstaPay
          </h1>
          <div className="inline-block">
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up">
              <span className="inline-block animate-typing">
                Revolutionizing payments with instant, secure, and transparent blockchain transactions.
              </span>
              <br />
              <span className="text-lg opacity-80">No more waiting, no more delays.</span>
            </p>
          </div>

          {/* Stats Card */}
          <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl px-8 py-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{jobCounter?.toString() || 0}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Jobs Created</div>
            </div>
            <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">0</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active Jobs</div>
            </div>
            <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">0</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Paid</div>
            </div>
          </div>

          {/* --- NEW: Display Hirer Info --- */}
          {jobCreatedByAddress && lastCreatedJobId === jobId && (
            <div className="mt-6 animate-slide-up">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-300 dark:border-blue-700 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-lg">👤</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Job Creator Info</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Job #{lastCreatedJobId} was created by:</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{jobCreatedByAddress}</p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <span className="animate-ping">⚠️</span>
                  <span>Ensure this matches your current wallet before releasing payment.</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setJobCreatedByAddress(null);
                      setLastCreatedJobId(null);
                      setJobId("");
                    }}
                    className="btn btn-sm btn-outline btn-warning"
                  >
                    Clear Session
                  </button>
                  <button
                    onClick={() => {
                      window.location.reload();
                    }}
                    className="btn btn-sm btn-outline btn-info"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* --- END NEW --- */}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Create Job Card */}
          <div className="group">
            <div
              className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 hover:scale-105 ${isAnimating ? "animate-pulse" : ""}`}
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-wiggle">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create & Fund Job</h2>
                    <p className="text-blue-100">Start a new project and fund it instantly</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Worker&apos;s Wallet Address
                    </label>
                    <AddressInput value={workerAddress} onChange={setWorkerAddress} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Amount (ETH)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.1"
                        className="input input-bordered w-full text-lg py-3 pl-4 pr-12"
                        value={jobAmount}
                        onChange={e => setJobAmount(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">ETH</div>
                    </div>
                  </div>

                  <button
                    className={`btn btn-primary w-full text-lg py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 ${isCreating ? "animate-pulse" : ""}`}
                    onClick={handleCreateJob}
                    disabled={isCreating || !workerAddress || !jobAmount}
                  >
                    {isCreating ? (
                      <div className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="animate-bounce">Creating Job...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="animate-bounce">💸</span>
                        <span>Create & Fund Job</span>
                        <span className="animate-ping">✨</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Release Payment Card */}
          <div className="group">
            <div
              className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 hover:scale-105 ${isAnimating ? "animate-pulse" : ""}`}
            >
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-wiggle">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Release Payment</h2>
                    <p className="text-green-100">Complete the job and release funds</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job ID</label>
                    <input
                      type="number"
                      placeholder="1"
                      className="input input-bordered w-full text-lg py-3"
                      value={jobId}
                      onChange={e => setJobId(e.target.value)}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Payment Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Awaiting Release</span>
                    </div>
                  </div>

                  <button
                    className={`btn btn-success w-full text-lg py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 ${isReleasing ? "animate-pulse" : ""}`}
                    onClick={handleReleasePayment}
                    disabled={isReleasing || !jobId}
                  >
                    {isReleasing ? (
                      <div className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="animate-bounce">Releasing Payment...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="animate-bounce">🎉</span>
                        <span>Release Payment</span>
                        <span className="animate-ping">💫</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-12">Why Choose InstaPay?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Instant Payments</h4>
              <p className="text-gray-600 dark:text-gray-400">
                No more waiting for 14-day delays. Get paid instantly when work is complete.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Secure & Transparent</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Blockchain-powered security with full transaction transparency.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Global Access</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Work with anyone, anywhere, with instant cross-border payments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
