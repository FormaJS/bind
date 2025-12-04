# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-04

### Changed

- **BREAKING:** Updated peer dependency to `@formajs/mold` ^2.0.0
- Updated all binders to support Mold v2.0.0 API
- Improved error flattening logic for nested objects and arrays

### Added

- Full support for Mold v2 formatters (formatDate, formatCurrency, formatMobileNumber, formatTaxId, toPercentage, toAccessible)
- Locale support documentation and examples
- ESLint flat config (eslint.config.js) for modern linting
- Comprehensive documentation for all six binders (RHF, Formik, VeeValidate, TanStack, Mantine, Felte)

### Fixed

- Removed debug console.log statements from tests
- Improved test stability with Mold v2 validation structure

## [1.0.0] - 2024

### Added

- Initial release
- React Hook Form binder (rhfBinder)
- Formik binder (formikBinder)
- VeeValidate binder (veeBinder)
- TanStack Form binder (tanstackBinder)
- Mantine Form binder (mantineBinder)
- Felte binder (felteBinder)
- Comprehensive test suite
- TypeScript declarations
