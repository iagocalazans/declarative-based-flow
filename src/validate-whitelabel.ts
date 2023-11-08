
function findObjectValue <T extends Record<string, any>>(object: T, keys: [keyof T], index = 0) {
    if (index < keys.length - 1 && Reflect.has(object, keys[index])) {
        const prop = Reflect.get(object, keys[index])
        return findObjectValue(prop, keys, ++index)
    }

    return object[keys[index]];
}
const validator = RegExp(/(?<={{).+(?=}})/);

export function isValidLabel (label: unknown): boolean {
    if (typeof label === 'string') {
        return validator.test(label);
    }

    return false;
}

function useWhiteLabel<T extends Record<string, any>>(label: string) {
    const [structure] = validator.exec(label)!;
    const trimmedStructure = structure.trim();
    return trimmedStructure.split('.') as unknown as [keyof T];
}

export function processWhiteLabel <T extends Record<string, any>>(label: string, object: T) {
    return findObjectValue(object, useWhiteLabel<T>(label))
}