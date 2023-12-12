import type { Thing, WithContext } from "schema-dts";

export function jsonLd<T extends Thing>(
	item: WithContext<T> | WithContext<T>[],
	space?: string | number,
): string {
	return JSON.stringify(item, safeJsonLdReplacer, space);
}

type JsonValueScalar = string | boolean | number;
type JsonValue =
	| JsonValueScalar
	| Array<JsonValue>
	| { [key: string]: JsonValue };
type JsonReplacer = (_: string, value: JsonValue) => JsonValue | undefined;

const ESCAPE_ENTITIES = Object.freeze({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
});
const ESCAPE_REGEX = new RegExp(
	`[${Object.keys(ESCAPE_ENTITIES).join("")}]`,
	"g",
);
const ESCAPE_REPLACER = (t: string): string =>
	ESCAPE_ENTITIES[t as keyof typeof ESCAPE_ENTITIES];

/**
 * A replacer for JSON.stringify to strip JSON-LD of illegal HTML entities
 * per https://www.w3.org/TR/json-ld11/#restrictions-for-contents-of-json-ld-script-elements
 */
const safeJsonLdReplacer: JsonReplacer = (() => {
	// Replace per https://www.w3.org/TR/json-ld11/#restrictions-for-contents-of-json-ld-script-elements
	// Solution from https://stackoverflow.com/a/5499821/864313
	return (_: string, value: JsonValue): JsonValue | undefined => {
		switch (typeof value) {
			case "object":
				// Omit null values.
				if (value === null) {
					return undefined;
				}

				return value; // JSON.stringify will recursively call replacer.
			case "number":
			case "boolean":
			case "bigint":
				return value; // These values are not risky.
			case "string":
				return value.replace(ESCAPE_REGEX, ESCAPE_REPLACER);
			default: {
				// We shouldn't expect other types.
				isNever(value);

				// JSON.stringify will remove this element.
				return undefined;
			}
		}
	};
})();

// Utility: Assert never
function isNever(_: never): void {}
