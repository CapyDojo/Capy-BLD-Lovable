
import React from 'react';
import { NameField } from '../forms/NameField';
import { TypeField } from '../forms/TypeField';
import { IndividualFieldsForm } from '../forms/IndividualFieldsForm';
import { EntityFieldsForm } from '../forms/EntityFieldsForm';

interface EntityFormFieldsProps {
  entityData: any;
  localName: string;
  isIndividual: boolean;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onNameKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onUpdateField: (field: string, value: string) => void;
}

export const EntityFormFields: React.FC<EntityFormFieldsProps> = ({
  entityData,
  localName,
  isIndividual,
  onNameChange,
  onNameBlur,
  onNameKeyPress,
  onUpdateField,
}) => {
  return (
    <div className="space-y-4">
      <NameField
        localName={localName}
        isIndividual={isIndividual}
        onNameChange={onNameChange}
        onNameBlur={onNameBlur}
        onNameKeyPress={onNameKeyPress}
      />
      
      <TypeField
        entityData={entityData}
        isIndividual={isIndividual}
        onUpdateField={onUpdateField}
      />
      
      {isIndividual ? (
        <IndividualFieldsForm
          entityData={entityData}
          onUpdateField={onUpdateField}
        />
      ) : (
        <EntityFieldsForm
          entityData={entityData}
          onUpdateField={onUpdateField}
        />
      )}
    </div>
  );
};
