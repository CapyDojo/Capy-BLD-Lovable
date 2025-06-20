import { Entity, EntityTypes } from '@/types/entity';

export interface EntityCategory {
  name: string;
  color: string;
  entities: Entity[];
  description: string;
}

/**
 * Dynamically categorizes entities based on their actual database metadata
 * instead of using fixed visual groupings
 */
export const categorizeEntities = (entities: Entity[]): EntityCategory[] => {
  const categories: Map<string, EntityCategory> = new Map();

  entities.forEach(entity => {
    let categoryKey: string;
    let categoryName: string;
    let description: string;
    let color: string;

    // Categorize based on entity type and metadata
    if (entity.type === 'Individual') {
      const role = entity.metadata?.role || entity.metadata?.title;
      if (role && (role.includes('Founder') || role.includes('CEO') || role.includes('CTO'))) {
        categoryKey = 'founders';
        categoryName = 'Founders & Management';
        description = 'Company founders, executives, and key management personnel';
        color = 'bg-blue-600';
      } else {
        categoryKey = 'individuals';
        categoryName = 'Other Individuals';
        description = 'Individual stakeholders and participants';
        color = 'bg-gray-600';
      }
    } else if (entity.metadata?.type === 'VC Fund') {
      categoryKey = 'institutional';
      categoryName = 'Institutional Investors';
      description = 'Venture capital funds and institutional investment entities';
      color = 'bg-green-600';
    } else if (entity.metadata?.type === 'Seed Fund') {
      categoryKey = 'early-stage';
      categoryName = 'Early Stage Investors';
      description = 'Seed funds and early-stage investment entities';
      color = 'bg-red-600';
    } else if (entity.type === 'Corporation' && entity.metadata?.purpose) {
      categoryKey = 'subsidiaries';
      categoryName = 'Subsidiaries';
      description = 'Operating subsidiaries and related corporate entities';
      color = 'bg-blue-800';
    } else if (entity.type === 'Trust' && entity.metadata?.purpose?.includes('Employee')) {
      categoryKey = 'employee-equity';
      categoryName = 'Employee Equity';
      description = 'Employee stock option pools and equity compensation structures';
      color = 'bg-purple-600';
    } else {
      // Default categorization by entity type
      categoryKey = entity.type.toLowerCase();
      categoryName = `${entity.type}s`;
      description = `${entity.type} entities`;
      color = getDefaultColorForEntityType(entity.type);
    }

    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, {
        name: categoryName,
        color,
        entities: [],
        description
      });
    }

    categories.get(categoryKey)!.entities.push(entity);
  });

  return Array.from(categories.values()).sort((a, b) => {
    // Sort by priority: founders first, then institutional, then others
    const priority = {
      'Founders & Management': 1,
      'Institutional Investors': 2,
      'Early Stage Investors': 3,
      'Employee Equity': 4,
      'Subsidiaries': 5
    };
    return (priority[a.name as keyof typeof priority] || 99) - (priority[b.name as keyof typeof priority] || 99);
  });
};

/**
 * Get default color for entity types not covered by metadata categorization
 */
const getDefaultColorForEntityType = (type: EntityTypes): string => {
  switch (type) {
    case 'Corporation': return 'bg-blue-600';
    case 'LLC': return 'bg-green-600';
    case 'Partnership': return 'bg-purple-600';
    case 'Trust': return 'bg-orange-600';
    case 'Individual': return 'bg-gray-600';
    default: return 'bg-gray-600';
  }
};

/**
 * Generate legend items for the organizational chart
 */
export const generateChartLegend = (entities: Entity[]) => {
  const categories = categorizeEntities(entities);
  
  return categories.map(category => ({
    label: category.name,
    color: category.color,
    count: category.entities.length,
    description: category.description
  }));
};

/**
 * Get the category color for a specific entity
 */
export const getEntityCategoryColor = (entity: Entity, categories: EntityCategory[]): string => {
  const category = categories.find(cat => 
    cat.entities.some(e => e.id === entity.id)
  );
  return category?.color || 'bg-gray-600';
};