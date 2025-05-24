HI-RadixSort: Hybrid Iterative Radix Sort
=========================================

### Description
HIRadixSort is an optimized hybrid sorting algorithm that combines the efficiency of 
**Most Significant Digit (MSD) Bit Radix Sort** with **Insertion Sort** for small partitions. 
This approach eliminates recursion by using an iterative stack-based method, improving 
cache locality and reducing stack depth.

### Features
- **In-place sorting** without additional memory overhead.
- **Iterative approach** eliminating recursive function calls.
- **Insertion sort cutoff** for handling small partitions efficiently.
- **Adaptive bit index** determination for optimal sorting performance.
- **Hoare-like 2-pointer partitioning** for better cache locality.

### Installation
To use **HIRadixSort**, simply clone the repository:

```sh
git clone https://github.com/dixy52-beep/HI-RadixSort.git
```

### Usage
Import and use the sorting function in JavaScript:

```js
const { HI_RadixSort } = require('./HIRadixSort');

let arr = [32, 45, 12, 87, 23, 89, 2, 78];
HI_RadixSort(arr);
console.log("Sorted Array:", arr);
```

### Algorithm Overview
1. Determine the maximum bit index dynamically.
2. Use a stack to manage partitions and process iteratively.
3. Perform **bit-wise partitioning** using a 2-pointer method.
4. Process smaller partitions in place, and push larger ones onto the stack.
5. Apply **Insertion Sort** when partition sizes fall below a cutoff threshold.
6. Continue iterating until all partitions are sorted.

### Performance
- **Time Complexity**: 
  - Best/Average Case: **O(n log n)** (depends on data distribution)
  - Worst Case: **O(n log² n)** (when many small partitions require sorting)
- **Space Complexity**: **O(1)** (in-place sorting)

### Testing
Run the test suite:

```sh
node HIRadixSort.js
```

### License
This project is licensed under the **MIT License**.

### Author
Created by **dixy52-beep**.
For contributions and bug reports, feel free to submit a pull request or open an issue.
