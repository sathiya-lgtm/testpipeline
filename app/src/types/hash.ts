class Hash<T> {
    private hash: Record<string, T | undefined> = {};

    get(key: string): T | undefined {
        return this.hash[key];
    }

    set(key: string, value: T): void {
        this.hash[key] = value;
    }

    remove(key: string): void {
        delete this.hash[key];
    }

    clear(): void {
        if (this.hash) {
            const keys = Object.keys(this.hash);
            keys.forEach((key) => {
                delete this.hash[key];
            });
        }
    }

    clone(): Hash<T> {
        const newHash = new Hash<T>();
        Object.assign(newHash.hash, this.hash);
        return newHash;
    }

    keys(): Array<string> {
        if (this.hash) {
            return Object.keys(this.hash);
        }
        return [];
    }
}

export default Hash;
