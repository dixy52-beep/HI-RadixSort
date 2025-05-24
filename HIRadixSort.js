/**
 * Sorts a small subarray using Insertion Sort.
 * Used as a cutoff for MSD Bit Radix Sort to handle small partitions efficiently.
 * @param {number[]} arr - The array containing the subarray.
 * @param {number} start - The starting index of the subarray.
 * @param {number} end - The ending index of the subarray.
 */
function insertionSort(arr, start, end) {
    for (let i = start + 1; i <= end; i++) {
        let current = arr[i];
        let j = i - 1;
        while (j >= start && arr[j] > current) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = current;
    }
}

// Define a cutoff size for switching to insertion sort.
// A slightly larger CUTOFF might improve cache locality for small segments.
const CUTOFF = 16; // Increased slightly from 12

/**
 * Sorts a list of non-negative integers using an iterative, in-place MSD Bit Radix Sort approach
 * with a cutoff to insertion sort for small subarrays.
 * Replaces recursion with an explicit stack and operates directly on the input array.
 * This version optimizes by always processing the smaller of the two partitions (0-partition or 1-partition)
 * iteratively and pushing the larger partition onto the stack. This helps limit stack depth.
 * Uses a 2-pointer (Hoare-like) partitioning scheme aimed at potentially better cache locality
 * compared to the 3-pointer (DNF) method.
 * Small partitions pushed to the stack are sorted immediately via insertion sort if below CUTOFF.
 * Inlines bit extraction logic.
 * Determines the maximum required bit index adaptively.
 *
 * This version refactors the main loop structure to process tasks popped from a stack,
 * entering an inner loop to process that specific partition branch iteratively until
 * a cutoff is reached or the partition becomes invalid, then returning to pop the next task.
 * This aims for a potentially cleaner iterative traversal structure.
 *
 * @param {number[]} arr - A list of non-negative integers to be sorted.
 * @returns {number[]} The same input array, sorted in place.
 */
function HI_RadixSort(arr) { // Function name changed from optimizedBitrieSortIterativeInPlaceV4 to HI_RadixSort
    if (!arr || arr.length <= 1) {
        return arr;
    }

    const n = arr.length;

    // Determine the maximum required bit index adaptively.
    let maxVal = 0;
    for (let i = 0; i < n; i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }
    // Handle case where maxVal is 0 or less. If all are 0, the array is sorted.
    // Math.log2(0) is -Infinity. Need 0 if maxVal is 0.
    const initialBitIndex = maxVal <= 0 ? 0 : Math.floor(Math.log2(maxVal)); // Use 0-based index

    // If the entire array is small enough or maxVal is 0, sort it directly and exit.
    // This handles the case where n=0 too due to the initial check.
    if (n < CUTOFF || maxVal <= 0) {
        if (n > 0) { // Only sort if the array is not empty
            insertionSort(arr, 0, n - 1);
        }
        return arr;
    }

    // Use a stack to manage partitions to be processed later. [start, end, bitIndex].
    const stack = [];

    // Push the initial partition task onto the stack.
    stack.push([0, n - 1, initialBitIndex]);

    // Main loop: While there are partitions on the stack to process.
    while (stack.length > 0) {
        // Pop the next partition task.
        let [current_start, current_end, current_bitIndex] = stack.pop();

        // Process this partition iteratively until it's small/done or split.
        // The condition checks if the partition is still valid and has bits left to process.
        while (current_start <= current_end && current_bitIndex >= 0) {
             const current_size = current_end - current_start + 1;

             // If the current partition is small enough, sort it using insertion sort
             // and finish processing this iterative branch.
             if (current_size < CUTOFF) {
                 // Only sort if the range is valid and non-empty before breaking.
                 if (current_start <= current_end) {
                      insertionSort(arr, current_start, current_end);
                 }
                 break; // Break out of the inner while loop. This branch is sorted.
             }

             // If we are here, the partition is large enough and needs partitioning based on the current bit.
             // Partition arr[current_start...current_end] based on current_bitIndex using 2-pointer method.
             let l = current_start; // Pointer scanning from left for 1-bits
             let r = current_end;   // Pointer scanning from right for 0-bits
             const bitIndex = current_bitIndex;

             // Perform 2-pointer partitioning (Hoare-like for bit sorting)
             while (l <= r) {
                 // Find first element from left (>= l) with 0-bit
                 while (l <= current_end && ((arr[l] >>> bitIndex) & 1) === 0) {
                     l++;
                 }
                 // Find first element from right (<= r) with 1-bit
                 while (r >= current_start && ((arr[r] >>> bitIndex) & 1) === 1) {
                     r--;
                 }

                 // If pointers haven't crossed, swap the elements with mismatched bits
                 // and continue scanning.
                 if (l < r) {
                     [arr[l], arr[r]] = [arr[r], arr[l]];
                     l++;
                     r--;
                 }
             }
             // After partitioning:
             // Elements with 0-bit for bitIndex are in arr[current_start ... r].
             // Elements with 1-bit for bitIndex are in arr[l ... current_end].
             // The split is between indices r and l.

             const next_bitIndex = current_bitIndex - 1; // Decrement bit index for the next level.

             // 0-partition range: [current_start, r]
             const len0 = r - current_start + 1;
             // 1-partition range: [l, current_end]
             const len1 = current_end - l + 1;

             // Decide which partition is smaller (len0 vs len1).
             // Process the smaller partition iteratively in the inner loop.
             // Handle the larger partition by pushing it onto the stack for later,
             // or sorting it immediately if it's small but non-empty.

             let next_iter_start, next_iter_end; // Parameters for the iterative part (the smaller partition)
             let push_start, push_end; // Parameters for the part pushed to stack (the larger partition)

             if (len0 <= len1) {
                 // 0-partition is smaller or equal: Process [current_start, r] iteratively.
                 next_iter_start = current_start;
                 next_iter_end = r;

                 // 1-partition is larger: [l, current_end]. Handle this larger partition.
                 push_start = l;
                 push_end = current_end;

                 // If the larger partition is still large enough (>= CUTOFF), push it onto the stack.
                 // Otherwise, if it's non-empty but small (< CUTOFF), sort it immediately.
                 const push_len = push_end - push_start + 1;
                 if (push_len >= CUTOFF) {
                     // Push [start, end, bitIndex] for the larger partition
                     stack.push([push_start, push_end, next_bitIndex]);
                 } else if (push_len > 0) { // Check for empty range before sorting
                     insertionSort(arr, push_start, push_end);
                 }
             } else { // len0 > len1
                 // 1-partition is smaller: Process [l, current_end] iteratively.
                 next_iter_start = l;
                 next_iter_end = current_end;

                 // 0-partition is larger: [current_start, r]. Handle this larger partition.
                 push_start = current_start;
                 push_end = r;

                 // If the larger partition is still large enough (>= CUTOFF), push it onto the stack.
                 // Otherwise, if it's non-empty but small (< CUTOFF), sort it immediately.
                 const push_len = push_end - push_start + 1;
                 if (push_len >= CUTOFF) {
                      // Push [start, end, bitIndex] for the larger partition
                     stack.push([push_start, push_end, next_bitIndex]);
                 } else if (push_len > 0) { // Check for empty range before sorting
                     insertionSort(arr, push_start, push_end);
                 }
             }

             // Update the parameters for the inner loop to continue processing the selected smaller partition.
             // The inner loop condition (current_start <= current_end && current_bitIndex >= 0)
             // will be checked again in the next iteration. If the newly set parameters represent
             // an invalid partition (start > end) or indicate no bits left (next_bitIndex < 0),
             // the inner while loop will terminate, and the main outer loop will then pop
             // the next waiting partition from the stack.
             current_start = next_iter_start;
             current_end = next_iter_end;
             current_bitIndex = next_bitIndex;

         } // End of inner while loop (this branch finished processing or hit cutoff)

         // The inner loop finished processing the current partition (or its iterative smaller part).
         // The outer loop will now naturally check stack.length and pop the next waiting partition task.

     } // End of outer while stack.length > 0

     // All partitions have been processed and sorted. Return the original array modified in-place.
     return arr;
}


// --- Main Test Function ---

/**
 * Checks if an array is sorted in non-decreasing order.
 * @param {number[]} arr - The array to check.
 * @returns {boolean} True if sorted, false otherwise.
 */
function isSorted(arr) {
    if (!arr || arr.length <= 1) {
        return true;
    }
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) {
            return false;
        }
    }
    return true;
}

/**
 * Generates an array of random non-negative integers.
 * @param {number} size - The size of the array.
 * @param {number} maxVal - The maximum value for elements in the array (exclusive).
 * @returns {number[]} A new array with random integers.
 */
function generateRandomArray(size, maxVal) {
    const arr = new Array(size);
    for (let i = 0; i < size; i++) {
        arr[i] = Math.floor(Math.random() * maxVal);
    }
    return arr;
}

/**
 * Main function to run tests for HI_RadixSort.
 */
function main() {
    console.log("--- HI_RadixSort Test Suite ---");
    console.log(`Insertion Sort CUTOFF: ${CUTOFF}`);
    console.log("---------------------------------");

    const testCases = [
        { name: "Empty Array", data: [] },
        { name: "Single Element", data: [42] },
        { name: "Two Elements (Sorted)", data: [10, 20] },
        { name: "Two Elements (Unsorted)", data: [20, 10] },
        { name: "Already Sorted (Small)", data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        { name: "Reverse Sorted (Small)", data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
        { name: "With Duplicates", data: [5, 2, 8, 2, 5, 1, 8, 3] },
        { name: "All Same Elements", data: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7] },
        { name: "Elements Around CUTOFF", data: [15, 1, 14, 2, 13, 3, 12, 4, 11, 5, 10, 6, 9, 7, 8, 16] },
        { name: "Values including 0", data: [5, 0, 3, 8, 0, 1] },
        { name: "All Zeros", data: [0, 0, 0, 0, 0] },
        { name: "Large Numbers (Small Array)", data: [987654321, 123456789, 500000000, 1, 1000000000, 42] },
    ];

    // Add random large arrays
    const randomTestSizes = [100, 1000, 10000, 100000, 500000, 1000000]; // Sizes for random arrays
    const maxRandomValue = 2 ** 30 - 1; // Max value up to 2^30 - 1 (fits in 30 bits)
    
    randomTestSizes.forEach(size => {
        testCases.push({
            name: `Random Array (Size ${size})`,
            generate: () => generateRandomArray(size, maxRandomValue),
        });
    });

    for (const testCase of testCases) {
        let arr;
        if (testCase.generate) {
            arr = testCase.generate();
        } else {
            arr = [...testCase.data]; // Create a copy to avoid modifying original test data
        }

        const arraySize = arr.length;
        const start = process.hrtime.bigint(); // High-resolution timer
        const sortedArr = HI_RadixSort(arr); // Sort in-place

        const end = process.hrtime.bigint();
        const elapsedTimeMs = Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds

        const isArrSorted = isSorted(sortedArr);

        console.log(`\n--- Test Case: ${testCase.name} ---`);
        console.log(`Array Size: ${arraySize}`);
        console.log(`Time Taken: ${elapsedTimeMs.toFixed(3)} ms`);
        console.log(`Sorted Correctly: ${isArrSorted ? 'Yes' : 'No'}`);

        if (!isArrSorted) {
            console.error("Sorting failed for this case!");
            // Optionally, print a small portion of the array for debugging
            // console.error("Original (if not generated):", testCase.data);
            // console.error("Sorted:", sortedArr.slice(0, 20), "...", sortedArr.slice(-20));
        }
    }

    console.log("\n--- Test Suite Complete ---");
}

// Run the main test function
main();
