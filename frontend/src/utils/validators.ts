import { type Question, type Section } from '../types';

/**
 * Validates dependencies to prevent circular references.
 * @returns string[] - List of error messages, or empty array if valid.
 */
export const validateSectionDependencies = (
    section: Section,
    allSections: Section[]
): string[] => {
    const errors: string[] = [];

    // 1. Self-reference
    // (Assuming dependencies are section IDs)
    if (section.depends_on_section_ids?.includes(section.id)) {
        errors.push(`Section "${section.name}" cannot depend on itself.`);
    }

    // 2. Circular dependency check (DFS)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (currentId: string): boolean => {
        visited.add(currentId);
        recursionStack.add(currentId);

        const currentSection = allSections.find(s => s.id === currentId);
        if (currentSection?.depends_on_section_ids) {
            for (const depId of currentSection.depends_on_section_ids) {
                if (!visited.has(depId)) {
                    if (detectCycle(depId)) return true;
                } else if (recursionStack.has(depId)) {
                    return true;
                }
            }
        }

        recursionStack.delete(currentId);
        return false;
    };

    // Check cycles starting from this section's dependencies
    // We strictly check if *adding* this section creates a cycle
    // But since we are editing 'section', we simulate the graph with this node updated.
    // For simplicity here, we assume 'allSections' includes the *old* version of this section, 
    // so we should look at the *new* dependencies.

    // Actually, simpler approach for "Prevent Circular Config":
    // When saving Section A, check if any of its dependencies (B, C) eventually depend on A.

    if (section.depends_on_section_ids) {
        for (const depId of section.depends_on_section_ids) {
            if (depId === section.id) continue; // Already caught

            // Does depId imply section.id?
            // We walk up the chain from depId.
            const stack = [depId];
            const seen = new Set<string>();

            while (stack.length > 0) {
                const curr = stack.pop()!;
                if (curr === section.id) {
                    errors.push(`Circular dependency detected: Section "${section.name}" depends on "${allSections.find(s => s.id === depId)?.name}", which eventually depends on "${section.name}".`);
                    break;
                }
                if (seen.has(curr)) continue;
                seen.add(curr);

                const s = allSections.find(x => x.id === curr);
                if (s && s.depends_on_section_ids) {
                    stack.push(...s.depends_on_section_ids);
                }
            }
            if (errors.length > 0) break;
        }
    }

    return errors;
};

/**
 * Validates that all referenced questions exist.
 */
export const validateSectionContent = (
    section: Section,
    allQuestions: Question[]
): string[] => {
    const errors: string[] = [];
    const questionIds = new Set(allQuestions.map(q => q.id));

    section.required_question_ids.forEach(qId => {
        if (!questionIds.has(qId)) errors.push(`Required question ID "${qId}" does not exist.`);
    });

    section.optional_question_ids.forEach(qId => {
        if (!questionIds.has(qId)) errors.push(`Optional question ID "${qId}" does not exist.`);
    });

    return errors;
};
