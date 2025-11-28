import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEntregadores } from '@/hooks/useEntregadores';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { differenceInDays, isBefore, isWithinInterval, addDays } from 'date-fns';

// --- Zod Schema ---
const entregadorSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  telefone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  veiculo_modelo: z.string().min(3, 'Modelo do veículo é obrigatório'),
  veiculo_placa: z.string().min(7, 'Placa do veículo é obrigatória'),
  cnh_numero: z.string().min(9, 'Número da CNH é obrigatório'),
  cnh_vencimento: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Data de vencimento é obrigatória' }),
  data_cadastro: z.string(),
  observacao: z.string().optional(),
});

type EntregadorFormValues = z.infer<typeof entregadorSchema>;

const steps = [
  { id: 1, name: 'Dados Pessoais', fields: ['nome', 'telefone', 'email'] },
  { id: 2, name: 'Veículo', fields: ['veiculo_modelo', 'veiculo_placa'] },
  { id: 3, name: 'CNH', fields: ['cnh_numero', 'cnh_vencimento'] },
  { id: 4, name: 'Revisão', fields: [] },
];

const CnhStatus = ({ vencimento }: { vencimento: string }) => {
    if (!vencimento || isNaN(Date.parse(vencimento))) return null;

    const dataVencimento = new Date(vencimento);
    const hoje = new Date();

    if (isBefore(dataVencimento, hoje)) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <XCircle className="text-red-500" />
                <div>
                    <p className="font-bold text-red-700">VENCIDA</p>
                    <p className="text-sm text-red-600">Venceu há {differenceInDays(hoje, dataVencimento)} dias.</p>
                </div>
            </div>
        )
    }

    if (isWithinInterval(dataVencimento, { start: hoje, end: addDays(hoje, 30) })) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="text-yellow-500" />
                <div>
                    <p className="font-bold text-yellow-700">ATENÇÃO</p>
                    <p className="text-sm text-yellow-600">Vence em {differenceInDays(dataVencimento, hoje)} dias.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" />
            <div>
                <p className="font-bold text-green-700">NO PRAZO</p>
                <p className="text-sm text-green-600">Válida por mais {differenceInDays(dataVencimento, hoje)} dias.</p>
            </div>
        </div>
    )
}

const FormEntregador = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { createEntregador, updateEntregador, entregadores } = useEntregadores();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<EntregadorFormValues>({
    resolver: zodResolver(entregadorSchema),
    defaultValues: async () => {
        if (isEditMode) {
            // Corrige a busca comparando string com string (após conversão)
            const entregador = entregadores.find(e => String(e.id) === id);
            if (entregador) {
              // Retorna o objeto direto, sem '.fields'
              return { 
                ...entregador, 
                cnh_vencimento: entregador.cnh_vencimento ? new Date(entregador.cnh_vencimento).toISOString().split('T')[0] : '' 
              };
            }
        }
        return {
          data_cadastro: new Date().toISOString().split('T')[0],
          nome: '',
          telefone: '',
          email: '',
          veiculo_modelo: '',
          veiculo_placa: '',
          cnh_numero: '',
          cnh_vencimento: '',
          observacao: ''
        };
    }
  });

  const { register, handleSubmit, trigger, watch, formState: { errors, isSubmitting } } = form;
  const cnhVencimento = watch('cnh_vencimento');

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });
    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const onSubmit: SubmitHandler<EntregadorFormValues> = async (values) => {
    try {
      if (isEditMode) {
        await updateEntregador(id!, values);
      } else {
        await createEntregador(values as any);
      }
      navigate('/entregadores');
    } catch (e) {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/entregadores')} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition"><ArrowLeft size={20} /> Voltar</button>
        <h1 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Editar Entregador' : 'Novo Entregador'}</h1>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => (
            <li key={step.id} className={`flex w-full items-center ${index < steps.length - 1 ? 'after:content-[""] after:w-full after:h-1 after:border-b after:border-4 after:inline-block' : ''} ${index <= currentStep ? 'after:border-purple-500' : 'after:border-slate-200'}`}>
              <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${index <= currentStep ? 'bg-purple-600 text-white' : 'bg-slate-200'}`}>
                {index < currentStep ? <Check size={20}/> : step.id}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 min-h-[400px]">
        <form id="entregador-form" onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                    <label className="font-medium text-slate-700">Nome Completo*</label>
                    <input {...register('nome')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                    {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="font-medium text-slate-700">Telefone*</label>
                        <input {...register('telefone')} placeholder="(00) 00000-0000" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">E-mail*</label>
                        <input {...register('email')} placeholder="exemplo@email.com" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                </div>
            </motion.div>
          )}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="font-medium text-slate-700">Modelo do Veículo*</label>
                      <input {...register('veiculo_modelo')} placeholder="Ex: Honda CG 160" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                      {errors.veiculo_modelo && <p className="text-red-500 text-xs mt-1">{errors.veiculo_modelo.message}</p>}
                  </div>
                  <div>
                      <label className="font-medium text-slate-700">Placa do Veículo*</label>
                      <input {...register('veiculo_placa')} placeholder="ABC-1234" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                      {errors.veiculo_placa && <p className="text-red-500 text-xs mt-1">{errors.veiculo_placa.message}</p>}
                  </div>
              </div>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="font-medium text-slate-700">Número da CNH*</label>
                        <input {...register('cnh_numero')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.cnh_numero && <p className="text-red-500 text-xs mt-1">{errors.cnh_numero.message}</p>}
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">Data de Vencimento*</label>
                        <input {...register('cnh_vencimento')} type="date" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.cnh_vencimento && <p className="text-red-500 text-xs mt-1">{errors.cnh_vencimento.message}</p>}
                    </div>
                </div>
                <div>
                    <label className="font-medium text-slate-700">Status da CNH</label>
                    <div className="mt-2"><CnhStatus vencimento={cnhVencimento} /></div>
                </div>
            </motion.div>
          )}
           {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h3 className="font-semibold text-xl text-slate-800">Revisão dos Dados</h3>
                    <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                        <p><strong>Nome:</strong> {form.getValues('nome')}</p>
                        <p><strong>Contato:</strong> {form.getValues('telefone')} / {form.getValues('email')}</p>
                        <p><strong>Veículo:</strong> {form.getValues('veiculo_modelo')} ({form.getValues('veiculo_placa')})</p>
                        <p><strong>CNH:</strong> {form.getValues('cnh_numero')} (Vence em: {form.getValues('cnh_vencimento')})</p>
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">Observações</label>
                        <textarea {...register('observacao')} rows={4} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" placeholder="Adicione observações sobre o entregador..."></textarea>
                    </div>
                </motion.div>
            )}
        </form>
      </div>

      <div className="flex justify-between mt-8">
        {currentStep > 0 && <button type="button" onClick={handlePrev} className="bg-white border border-slate-300 text-slate-700 rounded-xl px-6 py-3">Voltar</button>}
        <div className="flex-grow" />
        {currentStep < steps.length - 1 ? (
          <button type="button" onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-8 py-3 shadow-lg">Próximo</button>
        ) : (
          <button type="submit" form="entregador-form" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl px-8 py-3 shadow-lg">
            {isSubmitting ? 'Salvando...' : 'Salvar Entregador'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FormEntregador;