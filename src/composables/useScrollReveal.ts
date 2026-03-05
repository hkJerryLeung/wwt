import { onMounted, onUnmounted, type Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * GSAP ScrollTrigger-powered scroll reveal.
 * Elements with `.scroll-reveal` will fade-up into view.
 * Elements with `.scroll-reveal-child` inside `.scroll-reveal` will stagger in.
 */
export function useScrollReveal(containerRef: Ref<HTMLElement | null>) {
    let ctx: gsap.Context | null = null

    onMounted(() => {
        if (!containerRef.value) return

        ctx = gsap.context(() => {
            // ---- Basic scroll-reveal sections ----
            gsap.utils.toArray<HTMLElement>('.scroll-reveal').forEach((section) => {
                gsap.from(section, {
                    y: 60,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        end: 'top 50%',
                        toggleActions: 'play none none none',
                    },
                })

                // ---- Stagger children (cards, items) ----
                const children = section.querySelectorAll('.scroll-reveal-child')
                if (children.length > 0) {
                    gsap.from(children, {
                        y: 40,
                        opacity: 0,
                        duration: 0.7,
                        ease: 'power2.out',
                        stagger: 0.12,
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 75%',
                            toggleActions: 'play none none none',
                        },
                    })
                }
            })
        }, containerRef.value)
    })

    onUnmounted(() => {
        ctx?.revert()
    })
}
