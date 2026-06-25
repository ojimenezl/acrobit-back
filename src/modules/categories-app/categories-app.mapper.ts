import { CategoriesAppDocument } from './schemas/categories-app.schema';

export function toCategoryResponse(category: CategoriesAppDocument) {
  const json = category.toObject({ versionKey: false }) as Record<
    string,
    unknown
  >;

  return {
    categoryId: json['categoryId'],
    label: json['label'],
    color: json['color'],
    description: json['description'],
    selectionMin: json['selectionMin'],
    selectionMax: json['selectionMax'],
    manageMin: json['manageMin'],
    manageMax: json['manageMax'],
    manageWeight: json['manageWeight'],
    activities: (json['activities'] as Array<Record<string, unknown>>)
      .filter((activity) => activity['active'] !== false)
      .map((activity) => ({
        id: activity['id'],
        label: activity['label'],
      })),
    sortOrder: json['sortOrder'],
  };
}
