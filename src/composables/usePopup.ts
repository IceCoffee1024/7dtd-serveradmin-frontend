import type { SweetAlertTheme } from 'sweetalert2';
import { useZIndex } from 'element-plus';
import Swal from 'sweetalert2';
import QuestionCircle from '~icons/line-md/question-circle';
import { useTheme } from '~/composables';
import { i18n } from '~/plugins/i18n';
import 'sweetalert2/themes/bootstrap-5.css';
import 'sweetalert2/themes/bootstrap-4.css';
import 'sweetalert2/themes/material-ui.css';
import 'sweetalert2/themes/bulma.css';

interface PopupOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'question';
  title?: string;
  text?: string;
  inputValidator?: ((value: string) => string | boolean | void) | undefined;
  inputValue?: string;
  showCancelButton?: boolean;
}

export function usePopup() {
  const { t } = i18n.global;
  const { currentTheme, isDark } = useTheme();
  const { nextZIndex } = useZIndex();

  const MySwal = Swal.mixin({
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = nextZIndex().toString();
      }
    },
    heightAuto: false,
  });

  function isElementPlusPopBox() {
    return currentTheme.value.general.popBoxStyle === 'element-plus';
  }

  function getThemeForSweetAlert(): SweetAlertTheme {
    const style = currentTheme.value.general.popBoxStyle;
    if (style === 'sweetalert2') {
      return isDark.value ? 'dark' : 'light';
    }

    return (isDark.value ? `${style}-dark` : `${style}-light`) as SweetAlertTheme;
  }

  function getElementPlusType(type: PopupOptions['type']) {
    return type === 'question' ? 'primary' : type;
  }

  function getElementPlusIcon(type: PopupOptions['type']) {
    return type === 'question' ? QuestionCircle : undefined;
  }

  const toast = (options: PopupOptions) => {
    if (isElementPlusPopBox()) {
      ElMessage({
        message: options.text,
        type: getElementPlusType(options.type),
        grouping: true,
        showClose: true,
        duration: 3000,
        icon: getElementPlusIcon(options.type),
      });
    }
    else {
      MySwal.fire({
        text: options.text,
        icon: options.type || 'info',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        position: 'top',
        theme: getThemeForSweetAlert(),
      });
    }
  };

  const confirm = async (options: PopupOptions) => {
    if (isElementPlusPopBox()) {
      try {
        await ElMessageBox.confirm(options.text, options.title || t('composables.usePopup.warningTitle'), {
          confirmButtonText: t('composables.usePopup.confirmButtonText'),
          cancelButtonText: t('composables.usePopup.cancelButtonText'),
          showCancelButton: options.showCancelButton ?? true,
          type: getElementPlusType(options.type) || 'warning',
          icon: getElementPlusIcon(options.type),
        });
        return true;
      }
      catch {
        return false;
      }
    }
    else {
      const { isConfirmed } = await MySwal.fire({
        title: options.title || t('composables.usePopup.warningTitle'),
        text: options.text,
        icon: options.type || 'warning',
        showCancelButton: options.showCancelButton ?? true,
        confirmButtonColor: 'var(--colors-primary)',
        confirmButtonText: t('composables.usePopup.confirmButtonText'),
        cancelButtonText: t('composables.usePopup.cancelButtonText'),
        theme: getThemeForSweetAlert(),
      });
      return isConfirmed;
    }
  };

  const prompt = async (options: PopupOptions) => {
    if (isElementPlusPopBox()) {
      try {
        const { value } = await ElMessageBox.prompt(options.text, options.title, {
          inputValue: options.inputValue,
          confirmButtonText: t('composables.usePopup.confirmButtonText'),
          cancelButtonText: t('composables.usePopup.cancelButtonText'),
          type: getElementPlusType(options.type),
          showCancelButton: options.showCancelButton ?? true,
          inputValidator: options.inputValidator === undefined
            ? undefined
            : (value: string) => {
                const result = options.inputValidator!(value);
                return result === undefined ? true : result;
              },
        });
        return value;
      }
      catch {
        return undefined;
      }
    }
    else {
      const { value, isConfirmed } = await MySwal.fire({
        title: options.title || '',
        inputLabel: options.text || '',
        inputValue: options.inputValue,
        input: 'text',
        showCancelButton: options.showCancelButton ?? true,
        confirmButtonColor: 'var(--colors-primary)',
        confirmButtonText: t('composables.usePopup.confirmButtonText'),
        cancelButtonText: t('composables.usePopup.cancelButtonText'),
        theme: getThemeForSweetAlert(),
        inputValidator: options.inputValidator === undefined
          ? undefined
          : (value: string) => {
              const result = options.inputValidator!(value);
              return result === true ? undefined : result;
            },
      });

      return isConfirmed ? value : undefined;
    }
  };

  return {
    toast,
    confirm,
    prompt,
  };
}
