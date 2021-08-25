export function removeUndefinedsAtEndOfArray (arr: any[]) {
  let len = arr.length
  for (let i = len - 1; i >= 0; i--) {
    if (typeof arr[i] === 'undefined') len--
    else break
  }
  return arr.slice(0, len)
}