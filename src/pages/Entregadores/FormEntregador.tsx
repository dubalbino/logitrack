import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEntregadores } from '@/hooks/useEntregadores';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, User, Car, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
  { id: 1, name: 'Dados Pessoais' },
  { id: 2, name: 'Veículo' },
  { id: 3, name: 'CNH' },
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
            const entregador = entregadores.find(e => e.id === id);
            return entregador;
        }
        return { data_cadastro: new Date().toISOString().split('T')[0] };
    }
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = form;
  const cnhVencimento = watch('cnh_vencimento');

  const handleNext = () => setCurrentStep(step => step + 1);
  const handlePrev = () => setCurrentStep(step => step - 1);

  const onSubmit = async (values: EntregadorFormValues) => {
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
        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
                <div><label>Nome*</label><input {...register('nome')} className="w-full mt-2 input"/>{errors.nome && <p className='form-error'>{errors.nome.message}</p>}</div>
                <div><label>Telefone*</label><input {...register('telefone')} className="w-full mt-2 input"/>{errors.telefone && <p className='form-error'>{errors.telefone.message}</p>}</div>
                <div className="md:col-span-2"><label>Email*</label><input {...register('email')} className="w-full mt-2 input"/>{errors.email && <p className='form-error'>{errors.email.message}</p>}</div>
            </motion.div>
          )}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
                <div><label>Modelo do Veículo*</label><input {...register('veiculo_modelo')} className="w-full mt-2 input"/>{errors.veiculo_modelo && <p className='form-error'>{errors.veiculo_modelo.message}</p>}</div>
                <div><label>Placa*</label><input {...register('veiculo_placa')} className="w-full mt-2 input"/>{errors.veiculo_placa && <p className='form-error'>{errors.veiculo_placa.message}</p>}</div>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
                <div><label>Número da CNH*</label><input {...register('cnh_numero')} className="w-full mt-2 input"/>{errors.cnh_numero && <p className='form-error'>{errors.cnh_numero.message}</p>}</div>
                <div><label>Data de Vencimento*</label><input {...register('cnh_vencimento')} type="date" className="w-full mt-2 input"/>{errors.cnh_vencimento && <p className='form-error'>{errors.cnh_vencimento.message}</p>}</div>
                <div className="md:col-span-2"><label>Status da CNH</label><div className="mt-2"><CnhStatus vencimento={cnhVencimento} /></div></div>
                <div className="md:col-span-2"><label>Upload da CNH (opcional)</label><div className="mt-2 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md"><div class="space-y-1 text-center"><p>Arraste e solte ou clique para enviar</p></div></div></div>
            </motion.div>
          )}
        </form>
      </div>

      <div className="flex justify-between mt-8">
        {currentStep > 0 && <button type="button" onClick={handlePrev} className="btn-secondary">Voltar</button>}
        <div className="flex-grow" />
        {currentStep < steps.length - 1 && <button type="button" onClick={handleNext} className="btn-primary">Próximo</button>}
        {currentStep === steps.length - 1 && <button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary bg-green-600">{isSubmitting ? 'Salvando...' : 'Salvar Entregador'}</button>}
      </div>
    </motion.div>
  );
};

export default FormEntregador;