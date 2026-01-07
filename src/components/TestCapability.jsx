import React, { useState } from "react";
import axios from "axios";

/**
 * CONFIGURATION
 */
const TOTAL_NUMBERS = 100000;      // 1 lakh
const BATCH_SIZE = 1000;           // allowed 500–10000
const MAX_CONCURRENCY = 5;         // parallel API calls
const API_URL =
  "https://api.businessmessaging.jio.com/v1/messaging/usersBatchGet";

const axiosInstance = axios.create({
  timeout: 60000, // 60 sec
  headers: {
    "Content-Type": "application/json",
    // Authorization: "Bearer YOUR_TOKEN"
  },
});

/**
 * Generate random Indian phone numbers
 */
const generatePhoneNumbers = (count) => {
  const numbers = [];
  for (let i = 0; i < count; i++) {
    const num = Math.floor(6000000000 + Math.random() * 3999999999);
    numbers.push(`+91${num}`);
  }
  return numbers;
};

/**
 * Split array into chunks
 */
const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * CONCURRENCY POOL (frontend multithreading equivalent)
 */
const processWithConcurrency = async (tasks, limit, onProgress) => {
  let index = 0;
  let completed = 0;
  const results = [];

  const workers = new Array(limit).fill(null).map(async () => {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        const res = await tasks[currentIndex]();
        results[currentIndex] = res;
      } catch (err) {
        results[currentIndex] = { error: err.message };
      }
      completed++;
      onProgress(completed, tasks.length);
    }
  });

  await Promise.all(workers);
  return results;
};

const ParallelApiTest = () => {
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [timeTaken, setTimeTaken] = useState(null);

  const startTest = async () => {
    setStatus("Generating numbers...");
    setProgress(0);
    setTimeTaken(null);

    const startTime = performance.now();

    const phoneNumbers = generatePhoneNumbers(TOTAL_NUMBERS);
    const batches = chunkArray(phoneNumbers, BATCH_SIZE);

    setStatus(`Processing ${batches.length} batches...`);

    const tasks = batches.map((batch, index) => async () => {
      const t0 = performance.now();
      const response = await axiosInstance.post(API_URL, {
        phoneNumbers: batch,
      });
      const t1 = performance.now();

      return {
        batch: index + 1,
        count: batch.length,
        timeMs: Math.round(t1 - t0),
        data: response.data,
      };
    });

    await processWithConcurrency(
      tasks,
      MAX_CONCURRENCY,
      (done, total) => {
        setProgress(Math.round((done / total) * 100));
      }
    );

    const endTime = performance.now();
    setTimeTaken(Math.round(endTime - startTime));
    setStatus("Completed");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Parallel API Test (Frontend Multithreading)</h2>

      <p><strong>Total Numbers:</strong> {TOTAL_NUMBERS}</p>
      <p><strong>Batch Size:</strong> {BATCH_SIZE}</p>
      <p><strong>Parallel Requests:</strong> {MAX_CONCURRENCY}</p>

      <button onClick={startTest} disabled={status !== "Idle" && status !== "Completed"}>
        Start Test
      </button>

      <div style={{ marginTop: 20 }}>   
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Progress:</strong> {progress}%</p>
        {timeTaken && (
          <p>
            <strong>Total Time:</strong> {timeTaken} ms (
            {(timeTaken / 1000).toFixed(2)} sec)
          </p>
        )}
      </div>
    </div>
  );
};

export default ParallelApiTest;
