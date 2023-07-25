export function truncateString(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    } else {
        return str.slice(0, maxLength) + '...';
    }
}

export function formatTime(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    return formattedDate;
}