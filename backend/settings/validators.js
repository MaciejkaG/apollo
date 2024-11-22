export default {
    bool: (val) => {
        return typeof val === 'boolean';
    },
    voice: (val) => {
        const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        return voices.includes(val);
    }
};