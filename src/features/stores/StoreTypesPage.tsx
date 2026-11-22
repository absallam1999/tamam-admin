import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminStores } from "@shared/hooks/useAdminStores";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  StoreTypeDto,
  CreateStoreTypeDto,
  UpdateStoreTypeDto,
  StoreCategoryDto,
  CreateStoreCategoryDto,
  UpdateStoreCategoryDto,
} from "@shared/types";

// ============================================
// Icons
// ============================================

const SearchIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const GridIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
    />
  </svg>
);

const ImageIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const MoreIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

interface StoreTypeFormState {
  storeCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconUrl: string;
  imageUrl: string;
  displayOrder: number;
  commissionRate: number;
  isActive: boolean;
}

interface StoreCategoryFormState {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconUrl: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const initialTypeForm: StoreTypeFormState = {
  storeCategoryId: "",
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  iconUrl: "",
  imageUrl: "",
  displayOrder: 0,
  commissionRate: 0,
  isActive: true,
};

const initialCategoryForm: StoreCategoryFormState = {
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  iconUrl: "",
  imageUrl: "",
  displayOrder: 0,
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// StoreTypesPage Component
// ============================================

export const StoreTypesPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const toast = useToast();

  const {
    storeTypes,
    storeCategories,
    fetchStoreTypes,
    createStoreType,
    updateStoreType,
    deleteStoreType,
    toggleStoreTypeActive,
    fetchStoreCategories,
    createStoreCategory,
    updateStoreCategory,
    deleteStoreCategory,
    toggleStoreCategoryActive,
  } = useAdminStores();

  const [activeTab, setActiveTab] = useState<"types" | "categories">("types");
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Store Type Modals
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] =
    useState<StoreTypeDto | null>(null);
  const [deleteTypeConfirm, setDeleteTypeConfirm] =
    useState<StoreTypeDto | null>(null);
  const [typeForm, setTypeForm] =
    useState<StoreTypeFormState>(initialTypeForm);

  // Store Category Modals
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] =
    useState<StoreCategoryDto | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] =
    useState<StoreCategoryDto | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<StoreCategoryFormState>(initialCategoryForm);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([
        fetchStoreCategories(),
        fetchStoreTypes({
          StoreCategoryId: categoryFilter || undefined,
        }),
      ]);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحميل أنواع وتصنيفات المتاجر",
            en: "Failed to load store types and categories",
          }),
        ),
      );
    } finally {
      setInitialLoading(false);
    }
  }, [fetchStoreCategories, fetchStoreTypes, categoryFilter, toast, lang]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const filteredTypes = storeTypes.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.nameAr?.toLowerCase().includes(q) ||
      item.nameEn?.toLowerCase().includes(q) ||
      item.descriptionAr?.toLowerCase().includes(q) ||
      item.descriptionEn?.toLowerCase().includes(q) ||
      item.categoryNameAr?.toLowerCase().includes(q) ||
      item.categoryNameEn?.toLowerCase().includes(q)
    );
  });

  const filteredCategories = storeCategories.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.nameAr?.toLowerCase().includes(q) ||
      item.nameEn?.toLowerCase().includes(q) ||
      item.descriptionAr?.toLowerCase().includes(q) ||
      item.descriptionEn?.toLowerCase().includes(q)
    );
  });

  // ============================================
  // Store Type Handlers
  // ============================================

  const resetTypeForm = () => {
    setTypeForm({
      ...initialTypeForm,
      storeCategoryId: categoryFilter || storeCategories[0]?.id || "",
    });
  };

  const handleCreateType = async () => {
    if (!typeForm.storeCategoryId.trim()) {
      toast.error(
        lang({
          ar: "يرجى اختيار التصنيف الرئيسي",
          en: "Please select a store category",
        }),
      );
      return;
    }
    if (!typeForm.nameAr.trim() && !typeForm.nameEn.trim()) {
      toast.error(lang({ ar: "الاسم مطلوب", en: "Name is required" }));
      return;
    }
    setProcessingId("create-type");
    try {
      const dto: CreateStoreTypeDto = {
        storeCategoryId: typeForm.storeCategoryId.trim(),
        nameAr: typeForm.nameAr.trim() || null,
        nameEn: typeForm.nameEn.trim() || null,
        descriptionAr: typeForm.descriptionAr.trim() || null,
        descriptionEn: typeForm.descriptionEn.trim() || null,
        iconUrl: typeForm.iconUrl.trim() || null,
        imageUrl: typeForm.imageUrl.trim() || null,
        displayOrder: typeForm.displayOrder,
        commissionRate: typeForm.commissionRate,
      };
      await createStoreType(dto);
      toast.success(
        lang({ ar: "تم إنشاء النوع بنجاح", en: "Type created successfully" }),
      );
      setShowCreateTypeModal(false);
      resetTypeForm();
      await Promise.all([
        fetchStoreTypes({ StoreCategoryId: categoryFilter || undefined }),
        fetchStoreCategories(),
      ]);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل إنشاء النوع", en: "Failed to create type" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditType = async () => {
    if (!showEditTypeModal) return;
    if (!typeForm.storeCategoryId.trim()) {
      toast.error(
        lang({
          ar: "يرجى اختيار التصنيف الرئيسي",
          en: "Please select a store category",
        }),
      );
      return;
    }
    if (!typeForm.nameAr.trim() && !typeForm.nameEn.trim()) {
      toast.error(lang({ ar: "الاسم مطلوب", en: "Name is required" }));
      return;
    }
    setProcessingId("edit-type");
    try {
      const dto: UpdateStoreTypeDto = {
        storeCategoryId: typeForm.storeCategoryId.trim(),
        nameAr: typeForm.nameAr.trim() || null,
        nameEn: typeForm.nameEn.trim() || null,
        descriptionAr: typeForm.descriptionAr.trim() || null,
        descriptionEn: typeForm.descriptionEn.trim() || null,
        iconUrl: typeForm.iconUrl.trim() || null,
        imageUrl: typeForm.imageUrl.trim() || null,
        displayOrder: typeForm.displayOrder,
        commissionRate: typeForm.commissionRate,
        isActive: typeForm.isActive,
      };
      await updateStoreType(showEditTypeModal.id, dto);
      toast.success(
        lang({ ar: "تم تحديث النوع بنجاح", en: "Type updated successfully" }),
      );
      setShowEditTypeModal(null);
      resetTypeForm();
      await fetchStoreTypes({ StoreCategoryId: categoryFilter || undefined });
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث النوع", en: "Failed to update type" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleTypeActive = async (type: StoreTypeDto) => {
    setProcessingId(`toggle-type-${type.id}`);
    try {
      await toggleStoreTypeActive(type.id);
      toast.success(lang({ ar: "تم تحديث الحالة", en: "Status updated" }));
      await fetchStoreTypes({ StoreCategoryId: categoryFilter || undefined });
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
    setOpenMenuId(null);
  };

  const handleDeleteType = async () => {
    if (!deleteTypeConfirm) return;
    setProcessingId(`delete-type-${deleteTypeConfirm.id}`);
    try {
      await deleteStoreType(deleteTypeConfirm.id);
      toast.success(
        lang({ ar: "تم حذف النوع بنجاح", en: "Type deleted successfully" }),
      );
      setDeleteTypeConfirm(null);
      await Promise.all([
        fetchStoreTypes({ StoreCategoryId: categoryFilter || undefined }),
        fetchStoreCategories(),
      ]);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حذف النوع", en: "Failed to delete type" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openEditTypeModal = (type: StoreTypeDto) => {
    setTypeForm({
      storeCategoryId: type.storeCategoryId ?? "",
      nameAr: type.nameAr ?? "",
      nameEn: type.nameEn ?? "",
      descriptionAr: type.descriptionAr ?? "",
      descriptionEn: type.descriptionEn ?? "",
      iconUrl: type.iconUrl ?? "",
      imageUrl: type.imageUrl ?? "",
      displayOrder: type.displayOrder,
      commissionRate: type.commissionRate,
      isActive: type.isActive,
    });
    setShowEditTypeModal(type);
    setOpenMenuId(null);
  };

  // ============================================
  // Store Category Handlers
  // ============================================

  const resetCategoryForm = () => {
    setCategoryForm(initialCategoryForm);
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.nameAr.trim() && !categoryForm.nameEn.trim()) {
      toast.error(lang({ ar: "الاسم مطلوب", en: "Name is required" }));
      return;
    }
    setProcessingId("create-category");
    try {
      const dto: CreateStoreCategoryDto = {
        nameAr: categoryForm.nameAr.trim() || null,
        nameEn: categoryForm.nameEn.trim() || null,
        descriptionAr: categoryForm.descriptionAr.trim() || null,
        descriptionEn: categoryForm.descriptionEn.trim() || null,
        iconUrl: categoryForm.iconUrl.trim() || null,
        imageUrl: categoryForm.imageUrl.trim() || null,
        displayOrder: categoryForm.displayOrder,
        isActive: categoryForm.isActive,
      };
      await createStoreCategory(dto);
      toast.success(
        lang({
          ar: "تم إنشاء التصنيف بنجاح",
          en: "Category created successfully",
        }),
      );
      setShowCreateCategoryModal(false);
      resetCategoryForm();
      await fetchStoreCategories();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل إنشاء التصنيف", en: "Failed to create category" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditCategory = async () => {
    if (!showEditCategoryModal) return;
    if (!categoryForm.nameAr.trim() && !categoryForm.nameEn.trim()) {
      toast.error(lang({ ar: "الاسم مطلوب", en: "Name is required" }));
      return;
    }
    setProcessingId("edit-category");
    try {
      const dto: UpdateStoreCategoryDto = {
        nameAr: categoryForm.nameAr.trim() || null,
        nameEn: categoryForm.nameEn.trim() || null,
        descriptionAr: categoryForm.descriptionAr.trim() || null,
        descriptionEn: categoryForm.descriptionEn.trim() || null,
        iconUrl: categoryForm.iconUrl.trim() || null,
        imageUrl: categoryForm.imageUrl.trim() || null,
        displayOrder: categoryForm.displayOrder,
        isActive: categoryForm.isActive,
      };
      await updateStoreCategory(showEditCategoryModal.id, dto);
      toast.success(
        lang({
          ar: "تم تحديث التصنيف بنجاح",
          en: "Category updated successfully",
        }),
      );
      setShowEditCategoryModal(null);
      resetCategoryForm();
      await Promise.all([
        fetchStoreCategories(),
        fetchStoreTypes({ StoreCategoryId: categoryFilter || undefined }),
      ]);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث التصنيف", en: "Failed to update category" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleCategoryActive = async (category: StoreCategoryDto) => {
    setProcessingId(`toggle-cat-${category.id}`);
    try {
      await toggleStoreCategoryActive(category.id);
      toast.success(lang({ ar: "تم تحديث الحالة", en: "Status updated" }));
      await fetchStoreCategories();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
    setOpenMenuId(null);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;
    setProcessingId(`delete-cat-${deleteCategoryConfirm.id}`);
    try {
      await deleteStoreCategory(deleteCategoryConfirm.id);
      toast.success(
        lang({
          ar: "تم حذف التصنيف بنجاح",
          en: "Category deleted successfully",
        }),
      );
      setDeleteCategoryConfirm(null);
      if (categoryFilter === deleteCategoryConfirm.id) {
        setCategoryFilter("");
      }
      await fetchStoreCategories();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حذف التصنيف", en: "Failed to delete category" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openEditCategoryModal = (category: StoreCategoryDto) => {
    setCategoryForm({
      nameAr: category.nameAr ?? "",
      nameEn: category.nameEn ?? "",
      descriptionAr: category.descriptionAr ?? "",
      descriptionEn: category.descriptionEn ?? "",
      iconUrl: category.iconUrl ?? "",
      imageUrl: category.imageUrl ?? "",
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setShowEditCategoryModal(category);
    setOpenMenuId(null);
  };

  const t = {
    title: { ar: "تصنيفات وأنواع المتاجر", en: "Store Categories & Types" },
    subtitle: {
      ar: "إدارة تصنيفات المتاجر الرئيسية وأنواعها الفرعية",
      en: "Manage main store categories and their sub-types",
    },
    typesTab: { ar: "أنواع المتاجر", en: "Store Types" },
    categoriesTab: { ar: "التصنيفات الرئيسية", en: "Store Categories" },
    searchPlaceholder: {
      ar: "بحث بالاسم أو الوصف...",
      en: "Search by name or description...",
    },
    allCategories: { ar: "كل التصنيفات", en: "All Categories" },
    createType: { ar: "إضافة نوع جديد", en: "Add New Type" },
    createCategory: { ar: "إضافة تصنيف جديد", en: "Add New Category" },
    categoryLabel: { ar: "التصنيف الرئيسي", en: "Store Category" },
    selectCategory: { ar: "اختر التصنيف", en: "Select category" },
    noCategoriesWarning: {
      ar: "يرجى إضافة تصنيف رئيسي أولاً قبل إنشاء نوع متجر",
      en: "Please create a store category first before adding a store type",
    },
    nameAr: { ar: "الاسم (عربي)", en: "Name (Arabic)" },
    nameEn: { ar: "الاسم (إنجليزي)", en: "Name (English)" },
    namePlaceholder: { ar: "أدخل الاسم", en: "Enter name" },
    descriptionAr: { ar: "الوصف (عربي)", en: "Description (Arabic)" },
    descriptionEn: { ar: "الوصف (إنجليزي)", en: "Description (English)" },
    descriptionPlaceholder: { ar: "وصف مختصر", en: "Brief description" },
    iconUrl: { ar: "رابط الأيقونة", en: "Icon URL" },
    iconUrlPlaceholder: { ar: "https://...", en: "https://..." },
    imageUrl: { ar: "رابط الصورة", en: "Image URL" },
    imageUrlPlaceholder: { ar: "https://...", en: "https://..." },
    displayOrder: { ar: "ترتيب العرض", en: "Display Order" },
    commissionRate: { ar: "نسبة العمولة (%)", en: "Commission Rate (%)" },
    storesCount: { ar: "متاجر", en: "Stores" },
    typesCount: { ar: "أنواع", en: "Types" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    edit: { ar: "تعديل", en: "Edit" },
    toggleActive: { ar: "تبديل الحالة", en: "Toggle Active" },
    delete: { ar: "حذف", en: "Delete" },
    save: { ar: "حفظ", en: "Save" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    createTypeTitle: { ar: "إنشاء نوع متجر جديد", en: "Create New Store Type" },
    editTypeTitle: { ar: "تعديل نوع المتجر", en: "Edit Store Type" },
    deleteTypeTitle: { ar: "حذف نوع المتجر", en: "Delete Store Type" },
    createCategoryTitle: {
      ar: "إنشاء تصنيف متجر جديد",
      en: "Create New Store Category",
    },
    editCategoryTitle: {
      ar: "تعديل تصنيف المتجر",
      en: "Edit Store Category",
    },
    deleteCategoryTitle: {
      ar: "حذف تصنيف المتجر",
      en: "Delete Store Category",
    },
    deleteConfirm: {
      ar: "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
      en: "Are you sure you want to delete this item? This action cannot be undone.",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noTypes: { ar: "لا توجد أنواع متاجر", en: "No store types found" },
    noTypesDesc: {
      ar: "لم يتم إضافة أي أنواع متاجر بعد",
      en: "No store types have been added yet",
    },
    noCategories: {
      ar: "لا توجد تصنيفات متاجر",
      en: "No store categories found",
    },
    noCategoriesDesc: {
      ar: "لم يتم إضافة أي تصنيفات متاجر بعد",
      en: "No store categories have been added yet",
    },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    back: { ar: "العودة للمتاجر", en: "Back to Stores" },
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isAr ? "m8.25 4.5 7.5 7.5-7.5 7.5" : "M15.75 19.5 8.25 12l7.5-7.5"
            }
          />
        </svg>
        {lang(t.back)}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "types" ? (
            <button
              onClick={() => {
                if (storeCategories.length === 0) {
                  toast.error(lang(t.noCategoriesWarning));
                  setActiveTab("categories");
                  return;
                }
                resetTypeForm();
                setShowCreateTypeModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
            >
              <PlusIcon />
              {lang(t.createType)}
            </button>
          ) : (
            <button
              onClick={() => {
                resetCategoryForm();
                setShowCreateCategoryModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
            >
              <PlusIcon />
              {lang(t.createCategory)}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800 w-fit">
        <button
          onClick={() => setActiveTab("types")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "types"
              ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm"
              : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
          )}
        >
          {lang(t.typesTab)} ({storeTypes.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "categories"
              ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm"
              : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
          )}
        >
          {lang(t.categoriesTab)} ({storeCategories.length})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang(t.searchPlaceholder)}
            className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
        {activeTab === "types" && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[200px]"
          >
            <option value="">{lang(t.allCategories)}</option>
            {storeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {(isAr ? cat.nameAr || cat.nameEn : cat.nameEn || cat.nameAr) ||
                  "—"}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {initialLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" message={lang(t.loading)} />
        </div>
      ) : activeTab === "types" ? (
        filteredTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <GridIcon />
            </div>
            <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
              {lang(t.noTypes)}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {lang(t.noTypesDesc)}
            </p>
            <button
              onClick={() => {
                if (storeCategories.length === 0) {
                  toast.error(lang(t.noCategoriesWarning));
                  setActiveTab("categories");
                  return;
                }
                resetTypeForm();
                setShowCreateTypeModal(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
            >
              <PlusIcon />
              {lang(t.createType)}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTypes.map((type) => {
              const typeName =
                (isAr
                  ? type.nameAr || type.nameEn
                  : type.nameEn || type.nameAr) || "—";
              const typeDescription = isAr
                ? type.descriptionAr || type.descriptionEn
                : type.descriptionEn || type.descriptionAr;
              const categoryName = isAr
                ? type.categoryNameAr || type.categoryNameEn
                : type.categoryNameEn || type.categoryNameAr;

              return (
                <div
                  key={type.id}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Image */}
                  <div className="h-32 bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden">
                    {type.imageUrl ? (
                      <img
                        src={type.imageUrl}
                        alt={typeName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (
                            e.target as HTMLImageElement
                          ).parentElement?.classList.add(
                            "flex",
                            "items-center",
                            "justify-center",
                          );
                        }}
                      />
                    ) : (
                      <ImageIcon />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {type.iconUrl && (
                          <img
                            src={type.iconUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                            {typeName}
                          </h3>
                          {categoryName && (
                            <p className="text-[11px] font-medium text-primary-600 dark:text-primary-400 truncate mt-0.5">
                              {categoryName}
                            </p>
                          )}
                          {typeDescription && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                              {typeDescription}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className="relative flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === type.id ? null : type.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <MoreIcon />
                        </button>
                        {openMenuId === type.id && (
                          <div
                            className={cn(
                              "absolute z-20 top-full mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in-scale",
                              isAr
                                ? "left-0 origin-top-left"
                                : "right-0 origin-top-right",
                            )}
                          >
                            <button
                              onClick={() => openEditTypeModal(type)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                              {lang(t.edit)}
                            </button>
                            <button
                              onClick={() => handleToggleTypeActive(type)}
                              disabled={processingId === `toggle-type-${type.id}`}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                            >
                              {lang(t.toggleActive)}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTypeConfirm(type);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                            >
                              {lang(t.delete)}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                        <span>
                          {lang({ ar: "الترتيب", en: "Order" })}:{" "}
                          {type.displayOrder}
                        </span>
                        <span>• {type.commissionRate}%</span>
                        <span>
                          • {type.storeCount} {lang(t.storesCount)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          type.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            type.isActive ? "bg-emerald-500" : "bg-surface-400",
                          )}
                        />
                        {type.isActive ? lang(t.active) : lang(t.inactive)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <GridIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noCategories)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noCategoriesDesc)}
          </p>
          <button
            onClick={() => {
              resetCategoryForm();
              setShowCreateCategoryModal(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
          >
            <PlusIcon />
            {lang(t.createCategory)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const catName =
              (isAr ? cat.nameAr || cat.nameEn : cat.nameEn || cat.nameAr) ||
              "—";
            const catDesc = isAr
              ? cat.descriptionAr || cat.descriptionEn
              : cat.descriptionEn || cat.descriptionAr;

            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="h-32 bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={catName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {cat.iconUrl && (
                        <img
                          src={cat.iconUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                          {catName}
                        </h3>
                        {catDesc && (
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                            {catDesc}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className="relative flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === cat.id ? null : cat.id)
                        }
                        className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <MoreIcon />
                      </button>
                      {openMenuId === cat.id && (
                        <div
                          className={cn(
                            "absolute z-20 top-full mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in-scale",
                            isAr
                              ? "left-0 origin-top-left"
                              : "right-0 origin-top-right",
                          )}
                        >
                          <button
                            onClick={() => openEditCategoryModal(cat)}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                          >
                            {lang(t.edit)}
                          </button>
                          <button
                            onClick={() => handleToggleCategoryActive(cat)}
                            disabled={processingId === `toggle-cat-${cat.id}`}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                          >
                            {lang(t.toggleActive)}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteCategoryConfirm(cat);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                          >
                            {lang(t.delete)}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                    <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                      <span>
                        {lang({ ar: "الترتيب", en: "Order" })}:{" "}
                        {cat.displayOrder}
                      </span>
                      <span>
                        • {cat.storeTypeCount} {lang(t.typesCount)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        cat.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          cat.isActive ? "bg-emerald-500" : "bg-surface-400",
                        )}
                      />
                      {cat.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Store Type Modal */}
      {(showCreateTypeModal || showEditTypeModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowCreateTypeModal(false);
              setShowEditTypeModal(null);
              resetTypeForm();
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {showEditTypeModal
                ? lang(t.editTypeTitle)
                : lang(t.createTypeTitle)}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.categoryLabel)}{" "}
                  <span className="text-error-500">*</span>
                </label>
                <select
                  value={typeForm.storeCategoryId}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      storeCategoryId: e.target.value,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer"
                >
                  <option value="">{lang(t.selectCategory)}</option>
                  {storeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {(isAr
                        ? cat.nameAr || cat.nameEn
                        : cat.nameEn || cat.nameAr) || "—"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.nameAr)}
                  </label>
                  <input
                    type="text"
                    value={typeForm.nameAr}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, nameAr: e.target.value })
                    }
                    placeholder={lang(t.namePlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.nameEn)}
                  </label>
                  <input
                    type="text"
                    value={typeForm.nameEn}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, nameEn: e.target.value })
                    }
                    placeholder={lang(t.namePlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.descriptionAr)}
                  </label>
                  <textarea
                    value={typeForm.descriptionAr}
                    onChange={(e) =>
                      setTypeForm({
                        ...typeForm,
                        descriptionAr: e.target.value,
                      })
                    }
                    placeholder={lang(t.descriptionPlaceholder)}
                    rows={2}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.descriptionEn)}
                  </label>
                  <textarea
                    value={typeForm.descriptionEn}
                    onChange={(e) =>
                      setTypeForm({
                        ...typeForm,
                        descriptionEn: e.target.value,
                      })
                    }
                    placeholder={lang(t.descriptionPlaceholder)}
                    rows={2}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.iconUrl)}
                </label>
                <input
                  type="url"
                  value={typeForm.iconUrl}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, iconUrl: e.target.value })
                  }
                  placeholder={lang(t.iconUrlPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.imageUrl)}
                </label>
                <input
                  type="url"
                  value={typeForm.imageUrl}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, imageUrl: e.target.value })
                  }
                  placeholder={lang(t.imageUrlPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.displayOrder)}
                  </label>
                  <input
                    type="number"
                    value={typeForm.displayOrder}
                    onChange={(e) =>
                      setTypeForm({
                        ...typeForm,
                        displayOrder: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    min={0}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.commissionRate)}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={typeForm.commissionRate}
                    onChange={(e) =>
                      setTypeForm({
                        ...typeForm,
                        commissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>

              {showEditTypeModal && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={typeForm.isActive}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {lang(t.active)}
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowCreateTypeModal(false);
                  setShowEditTypeModal(null);
                  resetTypeForm();
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={showEditTypeModal ? handleEditType : handleCreateType}
                disabled={!!processingId}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {processingId ? lang(t.processing) : lang(t.save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Store Category Modal */}
      {(showCreateCategoryModal || showEditCategoryModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowCreateCategoryModal(false);
              setShowEditCategoryModal(null);
              resetCategoryForm();
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {showEditCategoryModal
                ? lang(t.editCategoryTitle)
                : lang(t.createCategoryTitle)}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.nameAr)}
                  </label>
                  <input
                    type="text"
                    value={categoryForm.nameAr}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        nameAr: e.target.value,
                      })
                    }
                    placeholder={lang(t.namePlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.nameEn)}
                  </label>
                  <input
                    type="text"
                    value={categoryForm.nameEn}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        nameEn: e.target.value,
                      })
                    }
                    placeholder={lang(t.namePlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.descriptionAr)}
                  </label>
                  <textarea
                    value={categoryForm.descriptionAr}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        descriptionAr: e.target.value,
                      })
                    }
                    placeholder={lang(t.descriptionPlaceholder)}
                    rows={2}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.descriptionEn)}
                  </label>
                  <textarea
                    value={categoryForm.descriptionEn}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        descriptionEn: e.target.value,
                      })
                    }
                    placeholder={lang(t.descriptionPlaceholder)}
                    rows={2}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.iconUrl)}
                </label>
                <input
                  type="url"
                  value={categoryForm.iconUrl}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      iconUrl: e.target.value,
                    })
                  }
                  placeholder={lang(t.iconUrlPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.imageUrl)}
                </label>
                <input
                  type="url"
                  value={categoryForm.imageUrl}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder={lang(t.imageUrlPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.displayOrder)}
                </label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      displayOrder: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  min={0}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      isActive: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {lang(t.active)}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowCreateCategoryModal(false);
                  setShowEditCategoryModal(null);
                  resetCategoryForm();
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={
                  showEditCategoryModal
                    ? handleEditCategory
                    : handleCreateCategory
                }
                disabled={!!processingId}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {processingId ? lang(t.processing) : lang(t.save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Type or Category) */}
      {(deleteTypeConfirm || deleteCategoryConfirm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setDeleteTypeConfirm(null);
              setDeleteCategoryConfirm(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-950/30 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-error-600 dark:text-error-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {deleteCategoryConfirm
                    ? lang(t.deleteCategoryTitle)
                    : lang(t.deleteTypeTitle)}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {(() => {
                    const target = deleteCategoryConfirm ?? deleteTypeConfirm;
                    if (!target) return "—";
                    return (
                      (isAr
                        ? target.nameAr || target.nameEn
                        : target.nameEn || target.nameAr) || "—"
                    );
                  })()}
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              {lang(t.deleteConfirm)}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteTypeConfirm(null);
                  setDeleteCategoryConfirm(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={
                  deleteCategoryConfirm
                    ? handleDeleteCategory
                    : handleDeleteType
                }
                disabled={!!processingId}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {processingId ? lang(t.processing) : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreTypesPage;