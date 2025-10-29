import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditableCellProps {
  value: any;
  onSave: (newValue: any) => Promise<void>;
  isEditable: boolean;
  type?: 'text' | 'number' | 'date' | 'badge';
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  isEditable,
  type = 'text',
  badgeVariant = 'secondary'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue || null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const displayValue = value || '—';

  if (!isEditable) {
    if (type === 'badge' && value) {
      return <Badge variant={badgeVariant}>{value}</Badge>;
    }
    return <span>{displayValue}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-xs"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 hover:bg-muted/50 p-1 rounded w-full text-left group"
    >
      {type === 'badge' && value ? (
        <Badge variant={badgeVariant}>{value}</Badge>
      ) : (
        <span>{displayValue}</span>
      )}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
    </button>
  );
};