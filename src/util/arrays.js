function mergeLists(dataMap, orderedKeys, chunkSize) {
    const result = [];
    let allListsEmpty = false;
    let currentIndex = 0;
    
    while (!allListsEmpty) {
        allListsEmpty = true;
        
        for (const key of orderedKeys) {
            const list = dataMap[key];
            const chunk = list.slice(currentIndex, currentIndex + chunkSize);
            
            if (chunk.length > 0) {
                result.push(...chunk);
                allListsEmpty = false;
            }
        }
        
        currentIndex += chunkSize;
    }
    
    return result;
}


/**
 * Sorts a list such that items from the second list appear in the same order as in the second list.
 * Unique items in the first list that are not in the second list are sorted at the end.
 */
function neighborhoodSort(listToSort, referenceList) {
    // Create a map of last indices in B
    const lastIndicesInB = new Map();
    referenceList.forEach((item, index) => {
      lastIndicesInB.set(item, index);
    });
  
    // Sort A based on the last indices in B
    return [...listToSort].sort((a, b) => {
      const indexA = lastIndicesInB.has(a) ? lastIndicesInB.get(a) : Infinity;
      const indexB = lastIndicesInB.has(b) ? lastIndicesInB.get(b) : Infinity;
      return indexA - indexB;
    });
  }

module.exports = { mergeLists, neighborhoodSort };