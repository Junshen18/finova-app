"use client";
import { useState } from "react";
import { addTransaction } from "./actions";

export default function AddTransactionPage() {
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Transaction</h1>
        <form
          action={async (formData) => {
            setError("");
            try {
              await addTransaction(formData);
            } catch (err: any) {
              setError(err.message || "Something went wrong");
            }
          }}
          className="flex flex-col gap-4"
        >
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-300"
            required
          />
          <input
            name="category"
            type="text"
            placeholder="Category (e.g. Food, Transport)"
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-300"
            required
          />
          <input
            name="description"
            type="text"
            placeholder="Description (optional)"
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <input
            name="date"
            type="date"
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-300"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
} 