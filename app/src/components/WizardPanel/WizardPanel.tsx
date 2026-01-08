import React, {useEffect, useState, useRef, FC, ReactElement, ReactNode} from 'react';
import Button from '../Button';

// CSS Styles
import "../../styles/components/WizardPanel/WizardPanel.scss"

export interface WizardStepProps {
    step: number;
    title: string;
    backButtonText?: string;
    nextButtonText?: string;
    saveButtonText?: string;
    scrollable?: boolean;
    children?: ReactNode | ReactNode[] | undefined | null;
    isStepComplete: boolean,
    onScrolledToButtom?: () => void;
};

export const WizardStep: FC<WizardStepProps> = ( {step, children, scrollable, onScrolledToButtom}: WizardStepProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const handleScroll = ( ) => {
        const container = containerRef.current;
        if(!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const reachedBottom = scrollTop + clientHeight >= scrollHeight - 1; 
        if ( reachedBottom ) {
            if( onScrolledToButtom ) {
                onScrolledToButtom();
            }
        }
    }

    if( scrollable ) {
        return (
            <div ref={containerRef} id={`wizard-step-${step}`} className="wizard-step scrollable" onScroll={handleScroll}>
                {children}
            </div>
        )
    } 
    return (
        <div id={`wizard-step-${step}`} className="wizard-step">
            {children}
        </div>
    )
};

export interface WizardPanelProps {
    scrollableMessageText?: string | undefined | null;
    children?: ReactElement<typeof WizardStep> | ReactElement<typeof WizardStep>[] | null | undefined;
    onBeforeBack?: (stepFrom: number, stepTo: number) => void;
    onBeforeNext?: (stepFrom: number, stepTo: number) => void;
    onComplete: () => void;
};


const WizardPanel: FC<WizardPanelProps> = ({ scrollableMessageText, children, onComplete, onBeforeNext, onBeforeBack }:WizardPanelProps) => {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [activeChild, setActiveChild] = useState<ReactNode | null>(null);
    const [activeProps, setActiveProps] = useState<WizardStepProps | null>(null);

    // Render Effects
    useEffect(() => {
        if( children ) {

            const stepsArray = React.Children.toArray(children).filter(
                (child): child is ReactElement<WizardStepProps> =>
                React.isValidElement(child) && child.type === WizardStep
            );

            const stepProps = stepsArray.map((child) => ({
                step: child.props.step ?? 1,
                title: child.props.title ?? '',
                scrollable: child.props.scrollable,
                isStepComplete: child.props.isStepComplete,
                backButtonText: child.props.backButtonText ?? 'Back',
                nextButtonText: child.props.nextButtonText ?? 'Next',
                saveButtonText: child.props.saveButtonText ?? 'Save',
            }));

            setActiveProps(stepProps[currentStep - 1]);

            const activeStep = stepsArray.find(
                (child) => child.props.step === currentStep
            );
            
            setActiveChild(activeStep);
        }        
    }, [currentStep, children])

    // Events Handlers
    const onHandleBack = ( ) => {
        if( onBeforeBack ) {
            onBeforeBack( currentStep, currentStep - 1);
        }
        setCurrentStep( ( prev ) => prev - 1 );
    }

    const onHandleNext = ( ) => {
        if( activeProps?.isStepComplete ) {
            if( onBeforeNext ) {
                onBeforeNext( currentStep, currentStep + 1);
            }
            setCurrentStep( ( prev ) => prev + 1 );
        }
    }

    const onHandleSave = ( ) => {
        if( activeProps?.isStepComplete ) {
            if( onComplete ) {
                onComplete( );
            }
        }
    }

    // Render Component
    return (
        <div className="wizard-panel">
            <div className="wizard-dialog slide-down">
                <div className="wizard-dialog-header">
                    {activeProps?.title ?? '[Title]'}
                </div>
                <div className="wizard-dialog-body">
                    {activeChild}
                </div>
                <div className="wizard-dialog-footer">
                    {activeProps?.scrollable && !activeProps?.isStepComplete && (
                        <span className="wizard-dialog-scrollable-message">
                            {scrollableMessageText} 
                        </span>
                    )}
                    {currentStep > 1 && (
                        <Button id="wizard-dialog-back-button" className="btn danger fade-in" label={activeProps?.backButtonText ?? 'Back'} onClick={onHandleBack} />
                    )}
                    {currentStep < React.Children.count(children) && (
                        <Button id="wizard-dialog-next-button" className="btn primary fade-in" label={activeProps?.nextButtonText ?? 'Next'} onClick={onHandleNext} visible={activeProps?.isStepComplete ?? false} />
                    )}
                    {currentStep === React.Children.count(children) && (
                        <Button id="wizard-dialog-save-button" className="btn primary fade-in" label={activeProps?.saveButtonText ?? 'Save'} onClick={onHandleSave} visible={activeProps?.isStepComplete ?? false} />
                    )}
                </div>
            </div>
        </div>
    )
};

export default WizardPanel;