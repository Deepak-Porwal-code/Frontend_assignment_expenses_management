import { useEffect, useId, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TextField, FieldGroup } from '../ui/Field';
import { CategoryIcon, CATEGORY_ICONS } from '../ui/Icon';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { CATEGORY_ICON_OPTIONS, COLOR_OPTIONS } from '../../lib/constants';
import { cx } from '../../lib/cx';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const EMPTY_FORM = {
  name: '',
  icon: 'tag',
  color: COLOR_OPTIONS[0],
};

function CategoryFormModal({ open, onClose, onSaved, type, category }) {
  const toast = useToast();
  const formId = useId();
  const isEditing = Boolean(category);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: category?.name || '',
      icon: category?.icon || 'tag',
      color: category?.color || COLOR_OPTIONS[0],
    });
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [open, category]);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();

    if (name.length < 2) {
      setErrors({ name: 'Give the category a name with at least 2 characters.' });
      return;
    }

    setErrors({});
    setFormError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await api(`/categories/${category._id}`, {
          method: 'PATCH',
          body: { name, icon: form.icon, color: form.color },
        });
      } else {
        await api('/categories', {
          method: 'POST',
          body: { name, type, icon: form.icon, color: form.color },
        });
      }

      toast.success(
        isEditing ? 'Category updated' : 'Category added',
        isEditing ? 'The new look applies everywhere.' : `“${name}” is ready to use.`,
      );
      await onSaved?.();
      onClose();
    } catch (error) {
      if (error.details?.length) {
        const fieldErrors = {};
        error.details.forEach((detail) => {
          if (detail.field) fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
        if (!Object.keys(fieldErrors).length) setFormError(error.message);
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit category' : 'New category'}
      description={isEditing
        ? 'Rename it or pick a different icon and colour.'
        : `A custom ${type} category, just for your account.`}
      size="md"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>
            {isEditing ? 'Save changes' : 'Add category'}
          </Button>
        </>
      )}
    >
      <form id={formId} className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <div className="category-preview" aria-hidden="true">
          <CategoryIcon category={{ icon: form.icon, color: form.color }} size="lg" />
          <div>
            <p className="category-preview__name">{form.name.trim() || 'Category name'}</p>
            <p className="category-preview__type">{type === 'income' ? 'Income' : 'Expense'} category</p>
          </div>
        </div>

        <TextField
          label="Name"
          placeholder={type === 'income' ? 'e.g. Freelance design' : 'e.g. Coffee runs'}
          value={form.name}
          maxLength={40}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          data-autofocus
        />

        <FieldGroup label="Icon" error={errors.icon}>
          <div className="icon-picker" role="radiogroup" aria-label="Category icon">
            {CATEGORY_ICON_OPTIONS.map((option) => {
              const Icon = CATEGORY_ICONS[option.value];
              const selected = form.icon === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={option.label}
                  title={option.label}
                  className={cx('icon-picker__item', selected && 'is-selected')}
                  onClick={() => update('icon', option.value)}
                >
                  {Icon && <Icon size={18} strokeWidth={1.9} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <FieldGroup label="Colour">
          <div className="color-picker" role="radiogroup" aria-label="Category colour">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={form.color === color}
                aria-label={`Colour ${color}`}
                className={cx('color-swatch', form.color === color && 'is-selected')}
                style={{ '--swatch': color }}
                onClick={() => update('color', color)}
              />
            ))}
          </div>
        </FieldGroup>
      </form>
    </Modal>
  );
}

export function CategoryManager() {
  const { categories, refreshCategories } = useAppData();
  const toast = useToast();
  const [type, setType] = useState('expense');
  const [formCategory, setFormCategory] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const visible = categories
    .filter((category) => category.type === type)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const builtInCount = visible.filter((category) => category.isDefault).length;
  const customCount = visible.length - builtInCount;

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/categories/${pendingDelete._id}`, { method: 'DELETE' });
      toast.success('Category deleted', 'It has been removed from your account.');
      setPendingDelete(null);
      await refreshCategories();
    } catch (error) {
      toast.error('Could not delete category', error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="settings-card settings-card--wide" aria-labelledby="categories-heading">
      <header className="settings-card__header">
        <div className="settings-card__heading">
          <span className="settings-card__icon" aria-hidden="true">
            <CATEGORY_ICONS.shapes size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="settings-card__title" id="categories-heading">Categories</h2>
            <p className="settings-card__description">
              Organise your money your way. Built-in categories stay put; yours can change any time.
            </p>
          </div>
        </div>
        <Button size="sm" variant="soft" icon={Plus} onClick={() => setFormCategory(null)}>
          New category
        </Button>
      </header>

      <div className="category-manager">
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          label="Category type"
          size="sm"
        />

        <ul className="category-list">
          {visible.map((category) => (
            <li className="category-row" key={category._id}>
              <CategoryIcon category={category} />
              <div className="category-row__text">
                <p className="category-row__name">{category.name}</p>
                <p className="category-row__meta">
                  {category.isDefault ? 'Built-in category' : 'Custom category'}
                </p>
              </div>
              {category.isDefault ? (
                <Badge tone="neutral" size="sm">Default</Badge>
              ) : (
                <div className="category-row__actions">
                  <IconButton
                    label={`Edit ${category.name}`}
                    icon={Pencil}
                    size="sm"
                    onClick={() => setFormCategory(category)}
                  />
                  <IconButton
                    label={`Delete ${category.name}`}
                    icon={Trash2}
                    size="sm"
                    className="icon-button--danger"
                    onClick={() => setPendingDelete(category)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>

        <p className="category-manager__note">
          {builtInCount} built-in {type} {builtInCount === 1 ? 'category' : 'categories'}
          {customCount > 0 && ` · ${customCount} custom`}
        </p>
      </div>

      <CategoryFormModal
        open={formCategory !== undefined}
        onClose={() => setFormCategory(undefined)}
        onSaved={refreshCategories}
        type={type}
        category={formCategory || null}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        description={pendingDelete
          ? `“${pendingDelete.name}” can only be deleted when no transactions, budgets or recurring rules use it.`
          : ''}
        confirmLabel="Delete category"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  );
}
