// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "hardhat/console.sol"; // For debugging

/**
 * @title InstaPay V1
 * @notice A simple smart contract for instant, trustless escrow payments.
 */
contract InstaPay {
    // --- STATE VARIABLES ---
    struct Job {
        address payable hirer;
        address payable worker;
        uint amount;
        bool paid;
    }
    mapping(uint => Job) public jobs;
    uint public jobCounter;

    // --- EVENTS ---
    event JobCreated(uint indexed jobId, address hirer, address worker, uint amount);
    event JobPaid(uint indexed jobId);

    // --- FUNCTIONS ---

    function createAndFundJob(address payable _worker) public payable {
        require(msg.value > 0, "InstaPay: Must send payment amount.");
        require(_worker != address(0), "InstaPay: Invalid worker address.");
        
        jobCounter++;
        
        jobs[jobCounter] = Job({
            hirer: payable(msg.sender),
            worker: _worker,
            amount: msg.value,
            paid: false
        });
        
        // --- FIXED LOGS ---
        // Break down the log into simpler parts
        console.log("InstaPay: Created Job ID:"); 
        console.log(jobCounter); 
        console.log("InstaPay: Worker Address:");
        console.log(_worker);
        console.log("InstaPay: Amount (wei):");
        console.log(msg.value);
        // --- END FIXED LOGS ---

        emit JobCreated(jobCounter, msg.sender, _worker, msg.value);
    }

    function releasePayment(uint _jobId) public {
        Job storage job = jobs[_jobId];
        
        require(msg.sender == job.hirer, "InstaPay: Only the original hirer can release this payment.");
        require(job.paid == false, "InstaPay: This job has already been paid.");
        
        job.paid = true;
        job.worker.transfer(job.amount); 
        
        // --- FIXED LOGS ---
        console.log("InstaPay: Released payment for Job ID:");
        console.log(_jobId);
        console.log("InstaPay: To Worker:");
        console.log(job.worker);
        // --- END FIXED LOGS ---

        emit JobPaid(_jobId);
    }
}
