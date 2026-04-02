import React from 'react';

export function TableInput({ label, type = 'text', name, value, onChange, placeholder, required = true, options = null }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-base"
          required={required}
        >
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 text-base"
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
}

export function FormActions({ onSubmit, onCancel, submitLabel = 'Save', submitIcon: Icon = null }) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        type="submit"
        onClick={onSubmit}
        className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center"
      >
        {Icon && <Icon className="mr-2" />}
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 text-sm font-semibold"
      >
        Cancel
      </button>
    </div>
  );
}

export function EmptyState({ Icon, message }) {
  return (
    <div className="py-12 text-center text-gray-500">
      <Icon className="text-5xl mx-auto mb-3 opacity-30" />
      <p className="text-lg">{message}</p>
    </div>
  );
}

export function ActionButtons({ buttons = [] }) {
  return (
    <div className="flex gap-1 justify-center whitespace-nowrap">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={btn.className}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
