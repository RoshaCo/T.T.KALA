(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeNavigation();
    initializeSmoothScroll();
    initializeHeaderState();
    initializeMobileNumberInputs();
    initializeToast();
    initializeCampaignInfo();
  });

  function initializeNavigation() {
    const headerChanceButton =
      document.querySelector("[data-header-chance]");

    if (headerChanceButton) {
      headerChanceButton.addEventListener("click", () => {
        scrollToElement("chance");
      });
    }

    document.querySelectorAll("[data-scroll-to]").forEach(button => {
      button.addEventListener("click", () => {
        const target = button.dataset.scrollTo;

        if (target) {
          scrollToElement(target);
        }
      });
    });
  }

  function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener("click", event => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        const target = document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        history.replaceState(
          null,
          "",
          href
        );
      });
    });
  }

  function scrollToElement(id) {
    const element =
      document.getElementById(id);

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function initializeHeaderState() {
    const header =
      document.querySelector(".site-header");

    if (!header) return;

    const updateHeader = () => {
      if (window.scrollY > 20) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };

    updateHeader();

    window.addEventListener(
      "scroll",
      updateHeader,
      {
        passive: true
      }
    );
  }

  function initializeMobileNumberInputs() {
    const inputs = document.querySelectorAll(
      'input[type="tel"]'
    );

    inputs.forEach(input => {
      input.setAttribute(
        "inputmode",
        "numeric"
      );

      input.setAttribute(
        "autocomplete",
        "tel"
      );

      input.addEventListener(
        "input",
        () => {
          const cursorPosition =
            input.selectionStart;

          input.value =
            normalizeDigits(
              input.value
            )
              .replace(/\D/g, "")
              .slice(0, 11);

          try {
            input.setSelectionRange(
              cursorPosition,
              cursorPosition
            );
          } catch (_) {}
        }
      );
    });
  }

  function normalizeDigits(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, digit =>
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
      )
      .replace(/[٠-٩]/g, digit =>
        "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
      );
  }

  function initializeToast() {
    const toast =
      document.getElementById("toast");

    if (!toast) return;

    window.TTKALAAShowToast = (
      message,
      type = "default",
      duration = 3500
    ) => {
      toast.textContent = message;

      toast.className =
        `toast is-visible ${type}`;

      clearTimeout(
        window.__TTKALAAToastTimer
      );

      window.__TTKALAAToastTimer =
        setTimeout(() => {
          toast.classList.remove(
            "is-visible"
          );
        }, duration);
    };
  }

  async function initializeCampaignInfo() {
    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi.getCurrentCampaign !==
          "function"
      ) {
        return;
      }

      const campaign =
        await window.TTKALAAApi.getCurrentCampaign();

      if (!campaign) return;

      window.TTKALAACurrentCampaign =
        campaign;

      updateCampaignElements(
        campaign
      );
    } catch (error) {
      console.warn(
        "Campaign information could not be loaded:",
        error
      );
    }
  }

  function updateCampaignElements(
    campaign
  ) {
    const campaignName =
      document.getElementById(
        "rulesCampaignName"
      );

    if (
      campaignName &&
      campaign.name
    ) {
      const year =
        campaign.year
          ? normalizeDigits(
              campaign.year
            )
          : "";

      campaignName.textContent =
        year
          ? `${campaign.name} ${year}`
          : campaign.name;
    }

    const campaignDateText =
      document.getElementById(
        "campaignDateText"
      );

    if (
      campaignDateText &&
      campaign.endDateText
    ) {
      campaignDateText.textContent =
        campaign.endDateText;
    }
  }

  function initializeLazyImages() {
    const images =
      document.querySelectorAll(
        "img[data-src]"
      );

    if (
      !("IntersectionObserver" in window)
    ) {
      images.forEach(image => {
        image.src =
          image.dataset.src;

        image.removeAttribute(
          "data-src"
        );
      });

      return;
    }

    const observer =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            const image =
              entry.target;

            image.src =
              image.dataset.src;

            image.removeAttribute(
              "data-src"
            );

            observer.unobserve(image);
          });
        },
        {
          rootMargin:
            "200px 0px"
        }
      );

    images.forEach(image =>
      observer.observe(image)
    );
  }

  function initializeExternalLinks() {
    document
      .querySelectorAll(
        'a[target="_blank"]'
      )
      .forEach(link => {
        link.setAttribute(
          "rel",
          "noopener noreferrer"
        );
      });
  }

  function initializeAccessibility() {
    document
      .querySelectorAll(
        "button:not([aria-label])"
      )
      .forEach(button => {
        const text =
          button.textContent.trim();

        if (text) {
          button.setAttribute(
            "aria-label",
            text
          );
        }
      });
  }

  function initializePageEnhancements() {
    initializeLazyImages();
    initializeExternalLinks();
    initializeAccessibility();
  }

  initializePageEnhancements();

  window.TTKALAA = {
    scrollTo: scrollToElement,
    normalizeDigits,
    showToast: (
      message,
      type,
      duration
    ) => {
      if (
        typeof window.TTKALAAShowToast ===
        "function"
      ) {
        window.TTKALAAShowToast(
          message,
          type,
          duration
        );
      }
    }
  };
})();
